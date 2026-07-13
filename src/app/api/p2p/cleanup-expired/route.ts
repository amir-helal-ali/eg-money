import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { roundEgp, roundUsdt } from '@/lib/money'
import { createNotification } from '@/lib/notifications'
import { pushBalanceUpdates } from '@/lib/balance-sync'

/**
 * POST /api/p2p/cleanup-expired
 * Auto-cancels P2P trades that have been in PENDING_PAYMENT for more than 30
 * minutes (default) without the buyer marking them as paid.
 *
 * This endpoint is meant to be called by the ticker-service cron job every
 * minute, but it's also safe to call manually.
 *
 * Settlement on auto-cancel:
 *  - Buyer's held EGP is refunded in full (including their fee side)
 *  - Seller's escrowed USDT is returned to the offer pool
 *  - Offer's usdtAmount is restored so it can be taken by other users
 *  - Both parties get a notification
 */
const AUTO_CANCEL_MINUTES = 30

export async function POST(req: NextRequest) {
  // ===== Shared-secret auth (REQUIRED) =====
  // This endpoint triggers P2P trade cancellation + refunds — too dangerous
  // to leave unauthenticated. Anyone could otherwise cancel trades at will.
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || cronSecret.length < 32) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured (must be ≥32 chars)' },
      { status: 503 },
    )
  }
  const supplied = req.headers.get('x-cron-secret')
  if (supplied !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - AUTO_CANCEL_MINUTES * 60 * 1000)

  // Find expired PENDING_PAYMENT trades
  const expired = await db.p2pTrade.findMany({
    where: {
      status: 'PENDING_PAYMENT',
      createdAt: { lt: cutoff },
    },
    include: { offer: true },
    take: 50, // process in batches
  })

  if (expired.length === 0) {
    return NextResponse.json({ cancelled: 0, message: 'No expired trades' })
  }

  let cancelled = 0
  const errors: string[] = []

  for (const trade of expired) {
    try {
      const feePerSide = roundEgp(Number(trade.feeEgp) / 2)
      const totalBuyerHeldEgp = roundEgp(Number(trade.egpAmount) + feePerSide)
      const usdtAmount = Number(trade.usdtAmount)

      await db.$transaction(async (tx) => {
        // Refund buyer EGP
        const buyer = await tx.user.findUnique({ where: { id: trade.buyerId } })
        if (buyer) {
          const newBuyerEgp = roundEgp(Number(buyer.egpBalance) + totalBuyerHeldEgp)
          await tx.user.update({
            where: { id: trade.buyerId },
            data: { egpBalance: newBuyerEgp },
          })
          await tx.transaction.create({
            data: {
              userId: trade.buyerId,
              type: 'P2P_TRADE',
              direction: 'CREDIT',
              currency: 'EGP',
              amount: totalBuyerHeldEgp,
              balanceAfter: newBuyerEgp,
              description: `استرجاع EGP من إلغاء تلقائي (انتهاء مهلة الدفع) - ${trade.id}`,
              referenceId: trade.id,
              referenceType: 'P2P_TRADE_AUTO_CANCEL',
            },
          })
        }

        // Refund seller USDT (escrow)
        const seller = await tx.user.findUnique({ where: { id: trade.sellerId } })
        if (seller) {
          const newSellerUsdt = roundUsdt(Number(seller.usdtBalance) + usdtAmount)
          await tx.user.update({
            where: { id: trade.sellerId },
            data: { usdtBalance: newSellerUsdt },
          })
          await tx.transaction.create({
            data: {
              userId: trade.sellerId,
              type: 'P2P_TRADE',
              direction: 'CREDIT',
              currency: 'USDT',
              amount: usdtAmount,
              balanceAfter: newSellerUsdt,
              description: `استرجاع USDT من إلغاء تلقائي (انتهاء مهلة الدفع) - ${trade.id}`,
              referenceId: trade.id,
              referenceType: 'P2P_TRADE_AUTO_CANCEL',
            },
          })
        }

        // Restore offer's USDT amount
        if (trade.offer && trade.offer.status === 'ACTIVE') {
          await tx.p2pOffer.update({
            where: { id: trade.offerId },
            data: {
              usdtAmount: roundUsdt(Number(trade.offer.usdtAmount) + usdtAmount),
            },
          })
        }

        // Mark trade as cancelled
        await tx.p2pTrade.update({
          where: { id: trade.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
          },
        })
      })

      // Push balance updates to both parties
      await pushBalanceUpdates([trade.buyerId, trade.sellerId])

      // Notify both parties
      await createNotification({
        userId: trade.buyerId,
        type: 'P2P',
        title: '⏰ انتهت مهلة الدفع',
        message: `تم إلغاء صفقة ${usdtAmount} USDT تلقائياً لعدم تأكيد الدفع خلال 30 دقيقة. تم استرجاع ${totalBuyerHeldEgp} EGP.`,
        metadata: { tradeId: trade.id, action: 'auto_cancel', reason: 'PAYMENT_TIMEOUT' },
      })
      await createNotification({
        userId: trade.sellerId,
        type: 'P2P',
        title: '⏰ انتهت مهلة دفع المشتري',
        message: `تم إلغاء صفقة ${usdtAmount} USDT تلقائياً لعدم تأكيد المشتري الدفع خلال 30 دقيقة. تم استرجاع USDT إلى رصيدك.`,
        metadata: { tradeId: trade.id, action: 'auto_cancel', reason: 'PAYMENT_TIMEOUT' },
      })

      cancelled++
    } catch (e) {
      console.error(`[cleanup] Failed to cancel trade ${trade.id}:`, e)
      errors.push(trade.id)
    }
  }

  return NextResponse.json({
    cancelled,
    errors: errors.length > 0 ? errors : undefined,
    message: `تم إلغاء ${cancelled} صفقة منتهية الصلاحية`,
  })
}
