import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/session'
import { createNotification } from '@/lib/notifications'
import { pushBalanceUpdates } from '@/lib/balance-sync'
import { roundEgp, roundUsdt } from '@/lib/money'

// GET /api/admin/p2p-disputes?status=OPEN — list disputes
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(req.url)
  const status = url.searchParams.get('status') // OPEN | UNDER_REVIEW | RESOLVED_BUYER | RESOLVED_SELLER | CANCELLED

  const where = status ? { status } : {}
  const disputes = await db.p2pDispute.findMany({
    where,
    include: {
      trade: {
        include: {
          buyer: { select: { id: true, name: true, username: true, email: true } },
          seller: { select: { id: true, name: true, username: true, email: true } },
          offer: { select: { id: true, type: true, paymentMethods: true } },
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 100,
            select: {
              id: true,
              senderId: true,
              message: true,
              createdAt: true,
              sender: { select: { id: true, name: true, username: true } },
            },
          },
        },
      },
      openedBy: { select: { id: true, name: true, username: true } },
      resolvedBy: { select: { id: true, name: true, username: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({
    disputes: disputes.map((d) => ({
      id: d.id,
      reason: d.reason,
      description: d.description,
      status: d.status,
      resolution: d.resolution,
      createdAt: d.createdAt,
      resolvedAt: d.resolvedAt,
      openedBy: d.openedBy,
      resolvedBy: d.resolvedBy,
      trade: {
        id: d.trade.id,
        usdtAmount: Number(d.trade.usdtAmount),
        egpAmount: Number(d.trade.egpAmount),
        priceEgp: Number(d.trade.priceEgp),
        feeEgp: Number(d.trade.feeEgp),
        paymentMethod: d.trade.paymentMethod,
        status: d.trade.status,
        createdAt: d.trade.createdAt,
        disputedAt: d.trade.disputedAt,
        buyerId: d.trade.buyerId,
        sellerId: d.trade.sellerId,
        buyer: d.trade.buyer,
        seller: d.trade.seller,
        offer: d.trade.offer,
        messages: d.trade.messages,
      },
    })),
  })
}

/**
 * PATCH /api/admin/p2p-disputes — resolve a dispute
 *
 * Body: { disputeId, resolution: 'RESOLVED_BUYER' | 'RESOLVED_SELLER' | 'CANCELLED', notes?: string }
 *
 * Settlement logic (corrected — previous version had a money-printing bug
 * where RESOLVED_BUYER gave the buyer BOTH the USDT escrow AND the held EGP,
 * meaning the seller lost their USDT for nothing):
 *
 *   RESOLVED_BUYER  → Buyer paid off-platform but seller didn't release.
 *                     → Buyer gets the USDT (escrow).
 *                     → Seller gets the EGP (the buyer's held EGP is released
 *                       to seller, minus platform fee — buyer DID pay).
 *                     → This is the "payment confirmed, force-release" case.
 *
 *   RESOLVED_SELLER → Buyer never paid (or payment was fake) but buyer wants USDT.
 *                     → Seller gets their USDT escrow back.
 *                     → Buyer gets their held EGP refunded (they didn't actually pay).
 *                     → This is the "no payment, cancel trade" case — same as CANCELLED.
 *                     → (Kept as distinct resolution for audit clarity.)
 *
 *   CANCELLED       → Full revert (mutual agreement, or admin kills the trade).
 *                     → Buyer gets EGP back, seller gets USDT back. Same as RESOLVED_SELLER.
 *
 * SECURITY: Uses a conditional updateMany on { id, status: { in: ACTIVE_STATES } }
 * to prevent two admins from resolving the same dispute simultaneously.
 */
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { disputeId, resolution, notes } = body

  if (!disputeId || !resolution) {
    return NextResponse.json({ error: 'disputeId و resolution مطلوبان' }, { status: 400 })
  }
  if (!['RESOLVED_BUYER', 'RESOLVED_SELLER', 'CANCELLED'].includes(resolution)) {
    return NextResponse.json({ error: 'resolution غير صالح' }, { status: 400 })
  }

  // Fetch the dispute + trade (outside the tx for read-only context)
  const dispute = await db.p2pDispute.findUnique({
    where: { id: disputeId },
    include: { trade: true },
  })
  if (!dispute) return NextResponse.json({ error: 'النزاع غير موجود' }, { status: 404 })

  const trade = dispute.trade
  if (!trade || trade.status !== 'DISPUTED') {
    return NextResponse.json({ error: 'الصفقة غير في حالة نزاع' }, { status: 400 })
  }

  // Settlement amounts
  const feePerSide = roundEgp(Number(trade.feeEgp) / 2)
  const totalBuyerHeldEgp = roundEgp(Number(trade.egpAmount) + feePerSide)
  const sellerReceivableEgp = roundEgp(Number(trade.egpAmount) - feePerSide)
  const usdtAmount = roundUsdt(Number(trade.usdtAmount))

  try {
    // ===== ATOMIC RESOLUTION =====
    // Conditional updateMany on the dispute status to prevent two admins
    // from resolving the same dispute simultaneously. Only succeeds if the
    // dispute is still in an active state (OPEN or UNDER_REVIEW).
    let resolved = false
    try {
      await db.$transaction(async (tx) => {
        // Conditional lock on the dispute — only proceed if still active
        const disputeLock = await tx.p2pDispute.updateMany({
          where: {
            id: disputeId,
            status: { in: ['OPEN', 'UNDER_REVIEW'] },
          },
          data: {
            status: resolution,
            resolution: notes || (
              resolution === 'RESOLVED_BUYER' ? 'تم الحل لصالح المشتري (دفع confirmed)'
              : resolution === 'RESOLVED_SELLER' ? 'تم الحل لصالح البائع (لا يوجد دفع)'
              : 'تم إلغاء الصفقة'
            ),
            resolvedById: admin.id,
            resolvedAt: new Date(),
          },
        })
        if (disputeLock.count === 0) {
          throw new Error('ALREADY_RESOLVED')
        }

        if (resolution === 'RESOLVED_BUYER') {
          // ===== BUYER WINS (payment was confirmed, force-release) =====
          // Buyer gets the USDT escrow (they paid for it).
          // Seller gets the EGP (the buyer's held EGP, minus platform fee).
          // Platform keeps the fee (already split between buyer-held and seller-receivable).
          const buyer = await tx.user.findUnique({ where: { id: trade.buyerId } })
          const seller = await tx.user.findUnique({ where: { id: trade.sellerId } })
          if (!buyer || !seller) throw new Error('USER_NOT_FOUND')

          // Credit buyer USDT (escrow released to buyer)
          const newBuyerUsdt = roundUsdt(Number(buyer.usdtBalance) + usdtAmount)
          await tx.user.update({
            where: { id: trade.buyerId },
            data: { usdtBalance: newBuyerUsdt },
          })
          await tx.transaction.create({
            data: {
              userId: trade.buyerId,
              type: 'P2P_TRADE',
              direction: 'CREDIT',
              currency: 'USDT',
              amount: usdtAmount,
              balanceAfter: newBuyerUsdt,
              description: `استلام USDT من نزاع (لصالح المشتري) - ${trade.id}`,
              referenceId: trade.id,
              referenceType: 'P2P_DISPUTE_RESOLVE',
            },
          })

          // Credit seller EGP (minus platform fee — buyer's held EGP goes to seller)
          const newSellerEgp = roundEgp(Number(seller.egpBalance) + sellerReceivableEgp)
          await tx.user.update({
            where: { id: trade.sellerId },
            data: { egpBalance: newSellerEgp },
          })
          await tx.transaction.create({
            data: {
              userId: trade.sellerId,
              type: 'P2P_TRADE',
              direction: 'CREDIT',
              currency: 'EGP',
              amount: sellerReceivableEgp,
              balanceAfter: newSellerEgp,
              description: `استلام EGP من نزاع (لصالح المشتري) - ${trade.id}`,
              referenceId: trade.id,
              referenceType: 'P2P_DISPUTE_RESOLVE',
            },
          })

          // Mark trade released
          await tx.p2pTrade.update({
            where: { id: trade.id },
            data: { status: 'RELEASED', releasedAt: new Date() },
          })
        } else if (resolution === 'RESOLVED_SELLER') {
          // ===== SELLER WINS (no payment / fake payment) =====
          // Seller gets their USDT escrow back.
          // Buyer gets their held EGP refunded (they didn't actually pay).
          // Platform keeps no fee (trade didn't complete).
          const buyer = await tx.user.findUnique({ where: { id: trade.buyerId } })
          const seller = await tx.user.findUnique({ where: { id: trade.sellerId } })
          if (!buyer || !seller) throw new Error('USER_NOT_FOUND')

          // Refund buyer's held EGP (full, including fee side)
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
              description: `استرجاع EGP من نزاع (لصالح البائع - لا يوجد دفع) - ${trade.id}`,
              referenceId: trade.id,
              referenceType: 'P2P_DISPUTE_REFUND',
            },
          })

          // Refund seller's USDT escrow
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
              description: `استرجاع USDT من نزاع (لصالح البائع) - ${trade.id}`,
              referenceId: trade.id,
              referenceType: 'P2P_DISPUTE_REFUND',
            },
          })

          // Mark trade cancelled
          await tx.p2pTrade.update({
            where: { id: trade.id },
            data: { status: 'CANCELLED', cancelledAt: new Date() },
          })
        } else {
          // ===== CANCELLED (full revert — same as RESOLVED_SELLER) =====
          const buyer = await tx.user.findUnique({ where: { id: trade.buyerId } })
          const seller = await tx.user.findUnique({ where: { id: trade.sellerId } })
          if (!buyer || !seller) throw new Error('USER_NOT_FOUND')

          // Refund buyer's held EGP
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
              description: `استرجاع EGP من إلغاء نزاع - ${trade.id}`,
              referenceId: trade.id,
              referenceType: 'P2P_DISPUTE_CANCEL',
            },
          })

          // Refund seller's USDT escrow
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
              description: `استرجاع USDT من إلغاء نزاع - ${trade.id}`,
              referenceId: trade.id,
              referenceType: 'P2P_DISPUTE_CANCEL',
            },
          })

          await tx.p2pTrade.update({
            where: { id: trade.id },
            data: { status: 'CANCELLED', cancelledAt: new Date() },
          })
        }
      })
      resolved = true
    } catch (e: any) {
      if (e?.message === 'ALREADY_RESOLVED') {
        return NextResponse.json({ error: 'النزاع تم حله مسبقاً' }, { status: 400 })
      }
      throw e
    }

    if (!resolved) {
      return NextResponse.json({ error: 'فشل حل النزاع' }, { status: 500 })
    }

    // Push real-time balance updates + notifications (outside tx)
    await pushBalanceUpdates([trade.buyerId, trade.sellerId])

    // Notify both parties about resolution
    const resolutionMsg: Record<string, { buyer: string; seller: string }> = {
      RESOLVED_BUYER: {
        buyer: 'تم حل النزاع لصالح المشتري — استلمت USDT (والEGP ذهب للبائع)',
        seller: 'تم حل النزاع لصالح المشتري — استلمت EGP (وUSDT ذهب للمشتري)',
      },
      RESOLVED_SELLER: {
        buyer: 'تم حل النزاع لصالح البائع — استرجعت EGP (لم يتم الدفع)',
        seller: 'تم حل النزاع لصالح البائع — استرجعت USDT (لم يتم الدفع)',
      },
      CANCELLED: {
        buyer: 'تم إلغاء النزاع — استرجعت EGP',
        seller: 'تم إلغاء النزاع — استرجعت USDT',
      },
    }
    const msg = resolutionMsg[resolution]
    await createNotification({
      userId: trade.buyerId,
      type: 'P2P',
      title: '⚖️ تم حل النزاع',
      message: msg.buyer + ` (صفقة ${usdtAmount} USDT)`,
      metadata: { tradeId: trade.id, disputeId, resolution },
    })
    await createNotification({
      userId: trade.sellerId,
      type: 'P2P',
      title: '⚖️ تم حل النزاع',
      message: msg.seller + ` (صفقة ${usdtAmount} USDT)`,
      metadata: { tradeId: trade.id, disputeId, resolution },
    })

    // Push real-time P2P event so both parties' UI refreshes
    try {
      const { pushP2pEvents } = await import('@/lib/p2p-events')
      await pushP2pEvents([trade.buyerId, trade.sellerId], {
        type: 'DISPUTE_RESOLVED',
        tradeId: trade.id,
        disputeId,
        resolution,
      })
    } catch {
      // Non-critical
    }

    // Post system message: dispute resolved
    try {
      const { postSystemMessage, SYSTEM_MESSAGES } = await import('@/lib/p2p-system-messages')
      const resolutionLabels: Record<string, string> = {
        RESOLVED_BUYER: 'لصالح المشتري (دفع confirmed — البائع استلم EGP)',
        RESOLVED_SELLER: 'لصالح البائع (لا يوجد دفع — استرجاع كامل)',
        CANCELLED: 'بإلغاء الصفقة واسترجاع الأموال للطرفين',
      }
      await postSystemMessage(
        trade.id,
        SYSTEM_MESSAGES.disputeResolved(
          resolutionLabels[resolution] || resolution,
          admin.name || admin.username,
        ),
        { buyerId: trade.buyerId, sellerId: trade.sellerId },
      )
    } catch {
      // Non-critical
    }

    return NextResponse.json({ success: true, message: 'تم حل النزاع' })
  } catch (e) {
    console.error('Dispute resolution error:', e)
    return NextResponse.json({ error: 'فشل حل النزاع' }, { status: 500 })
  }
}
