import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'
import {
  getSettings,
  getPublicSettings,
  roundEgp,
  roundUsdt,
} from '@/lib/money'
import { getLivePrice } from '@/lib/live-price'
import { pushBalanceUpdate } from '@/lib/balance-sync'
import { requireVerified } from '@/lib/verify-guard'
import { processReferralReward } from '@/lib/referral-reward'
import { TradeCreateSchema, parseBody } from '@/lib/schemas'

export async function GET(_req: NextRequest) {
  // Use public-safe settings (excludes googleClientSecret)
  const settings = await getPublicSettings()
  const live = await getLivePrice()
  return NextResponse.json({
    settings,
    livePrice: live,
  })
}

export async function POST(req: NextRequest) {
  try {
    const verifyError = await requireVerified(req)
    if (verifyError) return verifyError

    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    // ===== Zod validation =====
    const parsed = parseBody(TradeCreateSchema, body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }
    const { type, usdtAmount, egpAmount } = parsed.data

    const settings = await getSettings()

    // Fetch LIVE price from live market (via ticker-service)
    const live = await getLivePrice()
    if (!live || live.source !== 'live') {
      return NextResponse.json(
        { error: 'أسعار السوق غير متاحة حالياً. حاول مرة أخرى خلال لحظات.' },
        { status: 503 },
      )
    }

    let usdt = 0
    let egp = 0
    let priceEgp = 0

    if (type === 'BUY') {
      // User buys USDT from platform using EGP — uses live buyPriceEgp (higher)
      priceEgp = live.buyPriceEgp
      if (usdtAmount) {
        usdt = roundUsdt(Number(usdtAmount))
        egp = roundEgp(usdt * priceEgp)
      } else if (egpAmount) {
        egp = roundEgp(Number(egpAmount))
        usdt = roundUsdt(egp / priceEgp)
      } else {
        return NextResponse.json({ error: 'حدد كمية USDT أو مبلغ الجنيه' }, { status: 400 })
      }
    } else {
      // User sells USDT to platform for EGP — uses live sellPriceEgp (lower)
      priceEgp = live.sellPriceEgp
      if (usdtAmount) {
        usdt = roundUsdt(Number(usdtAmount))
        egp = roundEgp(usdt * priceEgp)
      } else if (egpAmount) {
        egp = roundEgp(Number(egpAmount))
        usdt = roundUsdt(egp / priceEgp)
      } else {
        return NextResponse.json({ error: 'حدد كمية USDT أو مبلغ الجنيه' }, { status: 400 })
      }
    }

    if (usdt <= 0 || egp <= 0) {
      return NextResponse.json({ error: 'المبالغ غير صحيحة' }, { status: 400 })
    }

    if (egp < settings.minTradeEgp || egp > settings.maxTradeEgp) {
      return NextResponse.json(
        { error: `الحد الأدنى ${settings.minTradeEgp} جنيه والحد الأقصى ${settings.maxTradeEgp} جنيه` },
        { status: 400 },
      )
    }

    // Apply platform fee (on EGP side)
    const feeEgp = roundEgp(egp * (settings.platformFeePercent / 100))

    // Execute trade atomically
    const trade = await db.$transaction(async (tx) => {
      const freshUser = await tx.user.findUnique({ where: { id: user.id } })
      if (!freshUser) throw new Error('USER_NOT_FOUND')

      if (type === 'BUY') {
        const totalEgpNeeded = roundEgp(egp + feeEgp)
        if (Number(freshUser.egpBalance) < totalEgpNeeded) {
          throw new Error('INSUFFICIENT_EGP_BALANCE')
        }
      } else {
        if (Number(freshUser.usdtBalance) < usdt) {
          throw new Error('INSUFFICIENT_USDT_BALANCE')
        }
      }

      const tradeRecord = await tx.trade.create({
        data: {
          userId: user.id,
          type,
          usdtAmount: usdt,
          egpAmount: egp,
          priceEgp,
          feeEgp,
          status: 'COMPLETED',
        },
      })

      if (type === 'BUY') {
        // Debit EGP (egp + fee), Credit USDT
        const newEgp = roundEgp(Number(freshUser.egpBalance) - egp - feeEgp)
        const newUsdt = roundUsdt(Number(freshUser.usdtBalance) + usdt)
        await tx.user.update({
          where: { id: user.id },
          data: { egpBalance: newEgp, usdtBalance: newUsdt },
        })
        await tx.transaction.create({
          data: {
            userId: user.id,
            type: 'TRADE',
            direction: 'DEBIT',
            currency: 'EGP',
            amount: egp,
            balanceAfter: newEgp,
            description: `شراء ${usdt} USDT بسعر ${priceEgp} جنيه`,
            referenceId: tradeRecord.id,
            referenceType: 'TRADE',
          },
        })
        if (feeEgp > 0) {
          await tx.transaction.create({
            data: {
              userId: user.id,
              type: 'FEE',
              direction: 'DEBIT',
              currency: 'EGP',
              amount: feeEgp,
              balanceAfter: newEgp,
              description: `رسوم شراء ${settings.platformFeePercent}%`,
              referenceId: tradeRecord.id,
              referenceType: 'TRADE',
            },
          })
        }
        await tx.transaction.create({
          data: {
            userId: user.id,
            type: 'TRADE',
            direction: 'CREDIT',
            currency: 'USDT',
            amount: usdt,
            balanceAfter: newUsdt,
            description: `شراء ${usdt} USDT بسعر ${priceEgp} جنيه`,
            referenceId: tradeRecord.id,
            referenceType: 'TRADE',
          },
        })
      } else {
        // Debit USDT, Credit EGP (minus fee)
        const newUsdt = roundUsdt(Number(freshUser.usdtBalance) - usdt)
        const newEgp = roundEgp(Number(freshUser.egpBalance) + egp - feeEgp)
        await tx.user.update({
          where: { id: user.id },
          data: { egpBalance: newEgp, usdtBalance: newUsdt },
        })
        await tx.transaction.create({
          data: {
            userId: user.id,
            type: 'TRADE',
            direction: 'DEBIT',
            currency: 'USDT',
            amount: usdt,
            balanceAfter: newUsdt,
            description: `بيع ${usdt} USDT بسعر ${priceEgp} جنيه`,
            referenceId: tradeRecord.id,
            referenceType: 'TRADE',
          },
        })
        await tx.transaction.create({
          data: {
            userId: user.id,
            type: 'TRADE',
            direction: 'CREDIT',
            currency: 'EGP',
            amount: egp,
            balanceAfter: newEgp,
            description: `بيع ${usdt} USDT بسعر ${priceEgp} جنيه`,
            referenceId: tradeRecord.id,
            referenceType: 'TRADE',
          },
        })
        if (feeEgp > 0) {
          await tx.transaction.create({
            data: {
              userId: user.id,
              type: 'FEE',
              direction: 'DEBIT',
              currency: 'EGP',
              amount: feeEgp,
              balanceAfter: newEgp,
              description: `رسوم بيع ${settings.platformFeePercent}%`,
              referenceId: tradeRecord.id,
              referenceType: 'TRADE',
            },
          })
        }
      }

      return tradeRecord
    })

    const updatedUser = await db.user.findUnique({ where: { id: user.id } })

    // ===== Referral reward (auto-completion on first trade) =====
    // If this user was referred and this is their first trade, mark the
    // referral as COMPLETED and credit the referrer's 50 EGP reward.
    // This replaces the old POST /api/referrals endpoint which was a
    // money-printing exploit.
    try {
      await processReferralReward(user.id, trade.id)
    } catch (e) {
      // Non-critical — don't fail the trade if referral processing fails
      console.error('Referral reward error:', e)
    }

    // Push real-time balance update via WebSocket
    await pushBalanceUpdate(user.id)

    // Create real notification for the user
    const { createNotification } = await import('@/lib/notifications')
    await createNotification({
      userId: user.id,
      type: 'TRADE',
      title: type === 'BUY' ? '✅ تم شراء USDT' : '✅ تم بيع USDT',
      message: type === 'BUY'
        ? `تم شراء ${usdt} USDT بسعر ${Number(trade.priceEgp)} EGP (إجمالي ${egp} EGP)`
        : `تم بيع ${usdt} USDT بسعر ${Number(trade.priceEgp)} EGP (استلمت ${egp} EGP)`,
      metadata: { tradeId: trade.id, type, usdtAmount: usdt, egpAmount: egp, priceEgp: Number(trade.priceEgp), action: 'view_dashboard' },
    })

    return NextResponse.json({
      trade: {
        id: trade.id,
        type: trade.type,
        usdtAmount: Number(trade.usdtAmount),
        egpAmount: Number(trade.egpAmount),
        priceEgp: Number(trade.priceEgp),
        feeEgp: Number(trade.feeEgp),
        status: trade.status,
        createdAt: trade.createdAt,
      },
      balances: {
        egpBalance: updatedUser ? Number(updatedUser.egpBalance) : 0,
        usdtBalance: updatedUser ? Number(updatedUser.usdtBalance) : 0,
      },
      message: type === 'BUY'
        ? `تم شراء ${usdt} USDT بنجاح`
        : `تم بيع ${usdt} USDT بنجاح`,
    })
  } catch (e: any) {
    console.error('Trade error:', e)
    const msg = e?.message || 'حدث خطأ غير متوقع'
    if (msg === 'INSUFFICIENT_EGP_BALANCE') {
      return NextResponse.json({ error: 'رصيد الجنيه غير كافٍ' }, { status: 400 })
    }
    if (msg === 'INSUFFICIENT_USDT_BALANCE') {
      return NextResponse.json({ error: 'رصيد USDT غير كافٍ' }, { status: 400 })
    }
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}
