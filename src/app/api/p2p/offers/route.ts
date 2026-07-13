import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'
import { getSettings, roundEgp, roundUsdt } from '@/lib/money'
import { createNotification } from '@/lib/notifications'
import { requireVerified } from '@/lib/verify-guard'
import { tickerPost } from '@/lib/ticker-client'
import { safeJsonParse } from '@/lib/safe-json'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const type = url.searchParams.get('type') // BUY | SELL
  const paymentMethod = url.searchParams.get('paymentMethod') // VODAFONE_CASH | INSTAPAY | FAWRY | BANK_TRANSFER
  const minPriceStr = url.searchParams.get('minPrice')
  const maxPriceStr = url.searchParams.get('maxPrice')
  const minAmountStr = url.searchParams.get('minAmount')
  const maxAmountStr = url.searchParams.get('maxAmount')
  const search = url.searchParams.get('q')?.trim() // username substring
  const sort = url.searchParams.get('sort') || 'price_asc' // price_asc | price_desc | newest | amount_desc

  const where: any = { status: 'ACTIVE' }
  if (type === 'BUY' || type === 'SELL') {
    where.type = type
  }
  if (paymentMethod) {
    where.paymentMethods = { contains: `"${paymentMethod}"` }
  }
  const minPrice = minPriceStr ? Number(minPriceStr) : null
  const maxPrice = maxPriceStr ? Number(maxPriceStr) : null
  if (minPrice !== null && !isNaN(minPrice)) where.priceEgp = { ...(where.priceEgp || {}), gte: minPrice }
  if (maxPrice !== null && !isNaN(maxPrice)) where.priceEgp = { ...(where.priceEgp || {}), lte: maxPrice }
  const minAmount = minAmountStr ? Number(minAmountStr) : null
  const maxAmount = maxAmountStr ? Number(maxAmountStr) : null
  if (minAmount !== null && !isNaN(minAmount)) where.usdtAmount = { ...(where.usdtAmount || {}), gte: minAmount }
  if (maxAmount !== null && !isNaN(maxAmount)) where.usdtAmount = { ...(where.usdtAmount || {}), lte: maxAmount }
  if (search) {
    where.user = { OR: [
      { username: { contains: search } },
      { name: { contains: search } },
    ] }
  }

  const orderBy: any = sort === 'newest'
    ? { createdAt: 'desc' }
    : sort === 'amount_desc'
    ? { usdtAmount: 'desc' }
    : sort === 'price_desc'
    ? { priceEgp: 'desc' }
    : { priceEgp: 'asc' } // default: price_asc (best price first)

  const offers = await db.p2pOffer.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, phone: true, createdAt: true, username: true,
          p2pTradesCount: true, p2pRatingSum: true, p2pRatingCount: true, emailVerified: true, phoneVerified: true },
      },
    },
    orderBy,
    take: 200,
  })

  // Batch-check online status for all offer owners (uses internal secret)
  const userIds = offers.map((o) => o.userId)
  let onlineMap: Record<string, boolean> = {}
  const onlineRes = await tickerPost<{ online?: Record<string, boolean> }>('/online-status', { userIds })
  if (onlineRes?.online) {
    onlineMap = onlineRes.online
  }

  return NextResponse.json({
    offers: offers.map((o) => {
      const ratingAvg = o.user.p2pRatingCount > 0 ? o.user.p2pRatingSum / o.user.p2pRatingCount : 0
      return {
        id: o.id,
        type: o.type,
        usdtAmount: Number(o.usdtAmount),
        priceEgp: Number(o.priceEgp),
        minOrderEgp: Number(o.minOrderEgp),
        maxOrderEgp: Number(o.maxOrderEgp),
        paymentMethods: safeJsonParse<string[]>(o.paymentMethods, []),
        status: o.status,
        createdAt: o.createdAt,
        user: {
          id: o.user.id,
          name: o.user.name || 'مستخدم',
          username: o.user.username,
          memberSince: o.user.createdAt,
          tradesCount: o.user.p2pTradesCount,
          ratingAvg: Math.round(ratingAvg * 10) / 10,
          ratingCount: o.user.p2pRatingCount,
          verified: o.user.emailVerified && o.user.phoneVerified,
          online: onlineMap[o.user.id] || false,
        },
      }
    }),
  })
}

export async function POST(req: NextRequest) {
  try {
    const verifyError = await requireVerified(req)
    if (verifyError) return verifyError

    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { type, usdtAmount, priceEgp, minOrderEgp, maxOrderEgp, paymentMethods } = body

    if (!type || (type !== 'BUY' && type !== 'SELL')) {
      return NextResponse.json({ error: 'النوع يجب أن يكون BUY أو SELL' }, { status: 400 })
    }

    const usdt = roundUsdt(Number(usdtAmount))
    const price = roundEgp(Number(priceEgp))

    if (usdt <= 0 || price <= 0) {
      return NextResponse.json({ error: 'الكمية والسعر يجب أن يكونا موجبين' }, { status: 400 })
    }

    const settings = await getSettings()
    if (price < settings.minP2pEgp || price > settings.maxP2pEgp) {
      return NextResponse.json(
        { error: `السعر خارج النطاق المسموح (${settings.minP2pEgp} - ${settings.maxP2pEgp} جنيه)` },
        { status: 400 },
      )
    }

    if (!Array.isArray(paymentMethods) || paymentMethods.length === 0) {
      return NextResponse.json({ error: 'حدد طريقة دفع واحدة على الأقل' }, { status: 400 })
    }

    const validMethods = ['VODAFONE_CASH', 'INSTAPAY', 'FAWRY', 'BANK_TRANSFER']
    for (const m of paymentMethods) {
      if (!validMethods.includes(m)) {
        return NextResponse.json({ error: `طريقة دفع غير صحيحة: ${m}` }, { status: 400 })
      }
    }

    // ===== ATOMIC OFFER CREATION =====
    // For SELL offers, the USDT escrow (debit) + offer creation + transaction
    // log all happen in ONE transaction. If the offer.create fails, the user's
    // USDT is untouched. Balance check is inside the transaction.
    let offer: { id: string; type: string; usdtAmount: any; priceEgp: any; minOrderEgp: any; maxOrderEgp: any; paymentMethods: string; status: string; createdAt: Date } | null = null
    try {
      offer = await db.$transaction(async (tx) => {
        if (type === 'SELL') {
          // Fresh read inside transaction for accurate balance
          const freshUser = await tx.user.findUnique({ where: { id: user.id } })
          if (!freshUser) throw new Error('USER_NOT_FOUND')
          const currentUsdt = Number(freshUser.usdtBalance)
          if (currentUsdt < usdt) throw new Error('INSUFFICIENT_USDT_BALANCE')

          // Debit USDT inside the same transaction
          const newBalance = roundUsdt(currentUsdt - usdt)
          await tx.user.update({
            where: { id: user.id },
            data: { usdtBalance: newBalance },
          })

          // Create the offer FIRST so we have an ID for the tx log
          const createdOffer = await tx.p2pOffer.create({
            data: {
              userId: user.id,
              type,
              usdtAmount: usdt,
              priceEgp: price,
              minOrderEgp: Number(minOrderEgp) || settings.minP2pEgp,
              maxOrderEgp: Number(maxOrderEgp) || settings.maxP2pEgp,
              paymentMethods: JSON.stringify(paymentMethods),
            },
          })

          await tx.transaction.create({
            data: {
              userId: user.id,
              type: 'P2P_TRADE',
              direction: 'DEBIT',
              currency: 'USDT',
              amount: usdt,
              balanceAfter: newBalance,
              description: `حجز USDT لإعلان بيع P2P`,
              referenceId: createdOffer.id,
              referenceType: 'P2P_ESCROW',
            },
          })

          return createdOffer
        } else {
          // BUY offer — no escrow needed
          return await tx.p2pOffer.create({
            data: {
              userId: user.id,
              type,
              usdtAmount: usdt,
              priceEgp: price,
              minOrderEgp: Number(minOrderEgp) || settings.minP2pEgp,
              maxOrderEgp: Number(maxOrderEgp) || settings.maxP2pEgp,
              paymentMethods: JSON.stringify(paymentMethods),
            },
          })
        }
      })
    } catch (e: any) {
      if (e?.message === 'INSUFFICIENT_USDT_BALANCE') {
        return NextResponse.json({ error: 'رصيد USDT غير كافٍ' }, { status: 400 })
      }
      throw e
    }

    if (!offer) {
      return NextResponse.json({ error: 'فشل إنشاء الإعلان' }, { status: 500 })
    }

    const updatedUser = await db.user.findUnique({ where: { id: user.id } })

    // Notify admins about new P2P offer (only for larger amounts ≥ 100 USDT)
    if (usdt >= 100) {
      const admins = await db.user.findMany({ where: { role: 'ADMIN', status: 'ACTIVE' } })
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          type: 'P2P',
          title: '📢 إعلان P2P جديد',
          message: `${user.name || user.email} نشر إعلان ${type === 'BUY' ? 'شراء' : 'بيع'} ${usdt} USDT @ ${price} EGP.`,
          metadata: { offerId: offer.id, usdtAmount: usdt, priceEgp: price, userId: user.id, action: 'admin_p2p' },
        })
      }
    }

    return NextResponse.json({
      offer: {
        id: offer.id,
        type: offer.type,
        usdtAmount: Number(offer.usdtAmount),
        priceEgp: Number(offer.priceEgp),
        minOrderEgp: Number(offer.minOrderEgp),
        maxOrderEgp: Number(offer.maxOrderEgp),
        paymentMethods,
        status: offer.status,
        createdAt: offer.createdAt,
      },
      balances: {
        egpBalance: updatedUser ? Number(updatedUser.egpBalance) : 0,
        usdtBalance: updatedUser ? Number(updatedUser.usdtBalance) : 0,
      },
      message: 'تم إنشاء الإعلان بنجاح',
    })
  } catch (e) {
    console.error('P2P offer create error:', e)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Cancelling an offer (which refunds escrowed USDT) requires verification
    const verifyError = await requireVerified(req)
    if (verifyError) return verifyError

    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const offerId = url.searchParams.get('id')
    if (!offerId) return NextResponse.json({ error: 'معرف الإعلان مطلوب' }, { status: 400 })

    const offer = await db.p2pOffer.findUnique({ where: { id: offerId } })
    if (!offer) return NextResponse.json({ error: 'الإعلان غير موجود' }, { status: 404 })
    if (offer.userId !== user.id) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    if (offer.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'لا يمكن إلغاء إعلان مكتمل' }, { status: 400 })
    }

    // ===== ATOMIC OFFER CANCEL =====
    // Refund escrowed USDT + mark offer as CANCELLED in one transaction.
    // Use conditional updateMany on { id, status: 'ACTIVE' } to prevent
    // double-cancel races.
    try {
      await db.$transaction(async (tx) => {
        const updateResult = await tx.p2pOffer.updateMany({
          where: { id: offerId, status: 'ACTIVE' },
          data: { status: 'CANCELLED' },
        })
        if (updateResult.count === 0) {
          throw new Error('ALREADY_CANCELLED_OR_COMPLETED')
        }

        if (offer.type === 'SELL') {
          // Refund escrowed USDT inside the same transaction
          const freshUser = await tx.user.findUnique({ where: { id: user.id } })
          if (!freshUser) throw new Error('USER_NOT_FOUND')
          const refundAmount = roundUsdt(Number(offer.usdtAmount))
          const newBalance = roundUsdt(Number(freshUser.usdtBalance) + refundAmount)
          await tx.user.update({
            where: { id: user.id },
            data: { usdtBalance: newBalance },
          })
          await tx.transaction.create({
            data: {
              userId: user.id,
              type: 'P2P_TRADE',
              direction: 'CREDIT',
              currency: 'USDT',
              amount: refundAmount,
              balanceAfter: newBalance,
              description: `استرجاع USDT من إعلان ملغى`,
              referenceId: offer.id,
              referenceType: 'P2P_ESCROW_REFUND',
            },
          })
        }
      })
    } catch (e: any) {
      if (e?.message === 'ALREADY_CANCELLED_OR_COMPLETED') {
        return NextResponse.json({ error: 'لا يمكن إلغاء إعلان مكتمل' }, { status: 400 })
      }
      throw e
    }

    const updatedUser = await db.user.findUnique({ where: { id: user.id } })
    return NextResponse.json({
      success: true,
      balances: {
        egpBalance: updatedUser ? Number(updatedUser.egpBalance) : 0,
        usdtBalance: updatedUser ? Number(updatedUser.usdtBalance) : 0,
      },
      message: 'تم إلغاء الإعلان',
    })
  } catch (e) {
    console.error('P2P offer cancel error:', e)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}

// PATCH /api/p2p/offers — edit an existing ACTIVE offer (price, amount, limits, methods)
// Body: { id, priceEgp?, usdtAmount?, minOrderEgp?, maxOrderEgp?, paymentMethods? }
export async function PATCH(req: NextRequest) {
  try {
    // Editing an offer (which may adjust escrow) requires verification
    const verifyError = await requireVerified(req)
    if (verifyError) return verifyError

    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, priceEgp, usdtAmount, minOrderEgp, maxOrderEgp, paymentMethods } = body
    if (!id) return NextResponse.json({ error: 'معرف الإعلان مطلوب' }, { status: 400 })

    const offer = await db.p2pOffer.findUnique({ where: { id } })
    if (!offer) return NextResponse.json({ error: 'الإعلان غير موجود' }, { status: 404 })
    if (offer.userId !== user.id) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    if (offer.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'لا يمكن تعديل إعلان غير نشط' }, { status: 400 })
    }

    const settings = await getSettings()
    const updates: any = {}

    if (priceEgp !== undefined) {
      const price = roundEgp(Number(priceEgp))
      if (price <= 0) return NextResponse.json({ error: 'السعر غير صالح' }, { status: 400 })
      if (price < settings.minP2pEgp || price > settings.maxP2pEgp) {
        return NextResponse.json(
          { error: `السعر خارج النطاق المسموح (${settings.minP2pEgp} - ${settings.maxP2pEgp} جنيه)` },
          { status: 400 },
        )
      }
      updates.priceEgp = price
    }

    if (usdtAmount !== undefined) {
      const newUsdt = roundUsdt(Number(usdtAmount))
      if (newUsdt <= 0) return NextResponse.json({ error: 'الكمية غير صالحة' }, { status: 400 })
      // For SELL offers, adjusting the amount affects the USDT escrow.
      // If increasing the amount, the user must have enough extra USDT.
      // If decreasing, refund the difference.
      // ===== ATOMIC AMOUNT ADJUSTMENT =====
      // All escrow adjustments + offer update happen in ONE transaction so
      // balance, escrow, and offer state stay consistent.
      if (offer.type === 'SELL') {
        const currentAmount = Number(offer.usdtAmount)
        const diff = newUsdt - currentAmount
        if (diff !== 0) {
          try {
            await db.$transaction(async (tx) => {
              const fresh = await tx.user.findUnique({ where: { id: user.id } })
              if (!fresh) throw new Error('USER_NOT_FOUND')

              if (diff > 0) {
                // Need to escrow more — check balance inside transaction
                if (Number(fresh.usdtBalance) < diff) {
                  throw new Error('INSUFFICIENT_USDT_BALANCE')
                }
                const newBalance = roundUsdt(Number(fresh.usdtBalance) - diff)
                await tx.user.update({
                  where: { id: user.id },
                  data: { usdtBalance: newBalance },
                })
                await tx.transaction.create({
                  data: {
                    userId: user.id,
                    type: 'P2P_TRADE',
                    direction: 'DEBIT',
                    currency: 'USDT',
                    amount: roundUsdt(diff),
                    balanceAfter: newBalance,
                    description: `زيادة كمية إعلان بيع`,
                    referenceId: id,
                    referenceType: 'P2P_ESCROW',
                  },
                })
              } else {
                // Refund the reduction (diff is negative)
                const refundAmount = roundUsdt(-diff)
                const newBalance = roundUsdt(Number(fresh.usdtBalance) + refundAmount)
                await tx.user.update({
                  where: { id: user.id },
                  data: { usdtBalance: newBalance },
                })
                await tx.transaction.create({
                  data: {
                    userId: user.id,
                    type: 'P2P_TRADE',
                    direction: 'CREDIT',
                    currency: 'USDT',
                    amount: refundAmount,
                    balanceAfter: newBalance,
                    description: `استرجاع USDT من تخفيض كمية إعلان`,
                    referenceId: id,
                    referenceType: 'P2P_ESCROW_REFUND',
                  },
                })
              }
            })
          } catch (e: any) {
            if (e?.message === 'INSUFFICIENT_USDT_BALANCE') {
              return NextResponse.json({ error: 'رصيد USDT غير كافٍ لزيادة الكمية' }, { status: 400 })
            }
            throw e
          }
        }
      }
      updates.usdtAmount = newUsdt
    }

    if (minOrderEgp !== undefined) {
      updates.minOrderEgp = Number(minOrderEgp) || settings.minP2pEgp
    }
    if (maxOrderEgp !== undefined) {
      updates.maxOrderEgp = Number(maxOrderEgp) || settings.maxP2pEgp
    }

    if (paymentMethods !== undefined) {
      if (!Array.isArray(paymentMethods) || paymentMethods.length === 0) {
        return NextResponse.json({ error: 'حدد طريقة دفع واحدة على الأقل' }, { status: 400 })
      }
      const validMethods = ['VODAFONE_CASH', 'INSTAPAY', 'FAWRY', 'BANK_TRANSFER']
      for (const m of paymentMethods) {
        if (!validMethods.includes(m)) {
          return NextResponse.json({ error: `طريقة دفع غير صحيحة: ${m}` }, { status: 400 })
        }
      }
      updates.paymentMethods = JSON.stringify(paymentMethods)
    }

    const updated = await db.p2pOffer.update({ where: { id }, data: updates })
    const updatedUser = await db.user.findUnique({ where: { id: user.id } })

    return NextResponse.json({
      offer: {
        id: updated.id,
        type: updated.type,
        usdtAmount: Number(updated.usdtAmount),
        priceEgp: Number(updated.priceEgp),
        minOrderEgp: Number(updated.minOrderEgp),
        maxOrderEgp: Number(updated.maxOrderEgp),
        paymentMethods: safeJsonParse<string[]>(updated.paymentMethods, []),
        status: updated.status,
      },
      balances: {
        egpBalance: updatedUser ? Number(updatedUser.egpBalance) : 0,
        usdtBalance: updatedUser ? Number(updatedUser.usdtBalance) : 0,
      },
      message: 'تم تعديل الإعلان',
    })
  } catch (e) {
    console.error('P2P offer edit error:', e)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}
