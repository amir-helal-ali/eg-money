import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'
import {
  getSettings,
  roundEgp,
  roundUsdt,
} from '@/lib/money'
import { createNotification } from '@/lib/notifications'
import { pushBalanceUpdates } from '@/lib/balance-sync'
import { pushP2pEvent, pushP2pEvents } from '@/lib/p2p-events'
import { postSystemMessage, SYSTEM_MESSAGES } from '@/lib/p2p-system-messages'
import { sendEmail, EMAIL_TEMPLATES } from '@/lib/email'
import { requireVerified } from '@/lib/verify-guard'
import { safeJsonParse } from '@/lib/safe-json'

// GET: list my P2P trades
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const trades = await db.p2pTrade.findMany({
    where: {
      OR: [{ buyerId: user.id }, { sellerId: user.id }],
    },
    include: {
      offer: true,
      buyer: { select: { id: true, name: true, phone: true } },
      seller: { select: { id: true, name: true, phone: true } },
      disputes: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      reviews: {
        where: { reviewerId: user.id },
        select: { id: true, rating: true, comment: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({
    trades: trades.map((t) => {
      const dispute = t.disputes[0]
      return {
        id: t.id,
        usdtAmount: Number(t.usdtAmount),
        egpAmount: Number(t.egpAmount),
        priceEgp: Number(t.priceEgp),
        feeEgp: Number(t.feeEgp),
        paymentMethod: t.paymentMethod,
        paymentReference: t.paymentReference,
        status: t.status,
        createdAt: t.createdAt,
        releasedAt: t.releasedAt,
        paidAt: t.paidAt,
        paymentDeadline: t.paymentDeadline,
        disputedAt: t.disputedAt,
        cancelledAt: t.cancelledAt,
        myRole: t.buyerId === user.id ? 'BUYER' : 'SELLER',
        counterparty: t.buyerId === user.id
          ? { id: t.seller.id, name: t.seller.name || 'مستخدم', phone: t.seller.phone }
          : { id: t.buyer.id, name: t.buyer.name || 'مستخدم', phone: t.buyer.phone },
        offer: {
          id: t.offer.id,
          type: t.offer.type,
          paymentMethods: safeJsonParse<string[]>(t.offer.paymentMethods, []),
        },
        dispute: dispute
          ? {
              id: dispute.id,
              reason: dispute.reason,
              description: dispute.description,
              status: dispute.status,
              resolution: dispute.resolution,
              openedById: dispute.openedById,
              createdAt: dispute.createdAt,
              resolvedAt: dispute.resolvedAt,
            }
          : null,
        myReview: t.reviews[0] || null,
      }
    }),
  })
}

// POST: take an offer (start a P2P trade)
export async function POST(req: NextRequest) {
  try {
    const verifyError = await requireVerified(req)
    if (verifyError) return verifyError

    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { offerId, usdtAmount, egpAmount, paymentMethod } = body

    if (!offerId) return NextResponse.json({ error: 'معرف الإعلان مطلوب' }, { status: 400 })
    if (!paymentMethod) return NextResponse.json({ error: 'طريقة الدفع مطلوبة' }, { status: 400 })

    const validMethods = ['VODAFONE_CASH', 'INSTAPAY', 'FAWRY', 'BANK_TRANSFER']
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json({ error: 'طريقة دفع غير صحيحة' }, { status: 400 })
    }

    const settings = await getSettings()

    const result = await db.$transaction(async (tx) => {
      const offer = await tx.p2pOffer.findUnique({
        where: { id: offerId },
        include: { user: true },
      })
      if (!offer) throw new Error('OFFER_NOT_FOUND')
      if (offer.status !== 'ACTIVE') throw new Error('OFFER_NOT_ACTIVE')
      if (offer.userId === user.id) throw new Error('CANNOT_TRADE_WITH_SELF')

      const methods: string[] = safeJsonParse<string[]>(offer.paymentMethods, [])
      if (!methods.includes(paymentMethod)) {
        throw new Error('PAYMENT_METHOD_NOT_ALLOWED')
      }

      let usdt = 0
      let egp = 0
      if (usdtAmount) {
        usdt = roundUsdt(Number(usdtAmount))
        egp = roundEgp(usdt * Number(offer.priceEgp))
      } else if (egpAmount) {
        egp = roundEgp(Number(egpAmount))
        usdt = roundUsdt(egp / Number(offer.priceEgp))
      } else {
        throw new Error('AMOUNT_REQUIRED')
      }

      if (usdt <= 0 || egp <= 0) throw new Error('INVALID_AMOUNT')
      if (usdt > Number(offer.usdtAmount)) throw new Error('EXCEEDS_OFFER_AMOUNT')

      const minOrderEgp = Number(offer.minOrderEgp)
      const maxOrderEgp = Number(offer.maxOrderEgp)
      if (egp < minOrderEgp || egp > maxOrderEgp) {
        throw new Error('OUT_OF_RANGE')
      }

      // Determine roles
      // If offer.type === 'SELL' (offer owner is selling USDT) → offer.userId = seller, taker = buyer
      // If offer.type === 'BUY' (offer owner wants to buy USDT) → offer.userId = buyer, taker = seller
      const isTakerBuyer = offer.type === 'SELL'
      const sellerId = isTakerBuyer ? offer.userId : user.id
      const buyerId = isTakerBuyer ? user.id : offer.userId

      // Refresh balances
      const seller = await tx.user.findUnique({ where: { id: sellerId } })
      const buyer = await tx.user.findUnique({ where: { id: buyerId } })
      if (!seller || !buyer) throw new Error('USER_NOT_FOUND')

      // For SELL offer: USDT is already escrowed at offer creation → deduct from offer pool
      // For BUY offer: taker (seller) must have USDT, escrow it now
      const feeEgp = roundEgp(egp * (settings.p2pFeePercent / 100))
      // Split fee 50/50 between buyer and seller
      const feePerSide = roundEgp(feeEgp / 2)

      if (offer.type === 'SELL') {
        // Buyer must have enough EGP for egp + fee
        const totalEgpNeeded = roundEgp(egp + feePerSide)
        if (Number(buyer.egpBalance) < totalEgpNeeded) {
          throw new Error('INSUFFICIENT_EGP_BALANCE')
        }
        // Lock buyer's EGP
        const newBuyerEgp = roundEgp(Number(buyer.egpBalance) - totalEgpNeeded)
        await tx.user.update({
          where: { id: buyerId },
          data: { egpBalance: newBuyerEgp },
        })
        await tx.transaction.create({
          data: {
            userId: buyerId,
            type: 'P2P_TRADE',
            direction: 'DEBIT',
            currency: 'EGP',
            amount: totalEgpNeeded,
            balanceAfter: newBuyerEgp,
            description: `حجز EGP لصفقة P2P مع ${seller.name || 'مستخدم'}`,
            referenceType: 'P2P_TRADE_HOLD',
          },
        })
      } else {
        // BUY offer: taker is seller, must have USDT
        if (Number(seller.usdtBalance) < usdt) {
          throw new Error('INSUFFICIENT_USDT_BALANCE')
        }
        const newSellerUsdt = roundUsdt(Number(seller.usdtBalance) - usdt)
        await tx.user.update({
          where: { id: sellerId },
          data: { usdtBalance: newSellerUsdt },
        })
        await tx.transaction.create({
          data: {
            userId: sellerId,
            type: 'P2P_TRADE',
            direction: 'DEBIT',
            currency: 'USDT',
            amount: usdt,
            balanceAfter: newSellerUsdt,
            description: `حجز USDT لصفقة P2P مع ${buyer.name || 'مستخدم'}`,
            referenceType: 'P2P_TRADE_ESCROW',
          },
        })
        // Buyer must have EGP for egp + fee
        const totalEgpNeeded = roundEgp(egp + feePerSide)
        if (Number(buyer.egpBalance) < totalEgpNeeded) {
          throw new Error('INSUFFICIENT_EGP_BALANCE')
        }
        const newBuyerEgp = roundEgp(Number(buyer.egpBalance) - totalEgpNeeded)
        await tx.user.update({
          where: { id: buyerId },
          data: { egpBalance: newBuyerEgp },
        })
        await tx.transaction.create({
          data: {
            userId: buyerId,
            type: 'P2P_TRADE',
            direction: 'DEBIT',
            currency: 'EGP',
            amount: totalEgpNeeded,
            balanceAfter: newBuyerEgp,
            description: `حجز EGP لصفقة P2P مع ${seller.name || 'مستخدم'}`,
            referenceType: 'P2P_TRADE_HOLD',
          },
        })
      }

      // Reduce offer amount
      const newOfferUsdt = roundUsdt(Number(offer.usdtAmount) - usdt)
      const offerUpdate: any = { usdtAmount: newOfferUsdt }
      if (newOfferUsdt <= 0) {
        offerUpdate.status = 'COMPLETED'
      }
      await tx.p2pOffer.update({ where: { id: offer.id }, data: offerUpdate })

      // Create P2P trade record
      const p2pTrade = await tx.p2pTrade.create({
        data: {
          offerId: offer.id,
          buyerId,
          sellerId,
          usdtAmount: usdt,
          egpAmount: egp,
          priceEgp: Number(offer.priceEgp),
          feeEgp,
          paymentMethod,
          status: 'PENDING_PAYMENT',
          escrowUsdt: usdt,
          paymentDeadline: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        },
      })

      return { p2pTrade, usdt, egp, feeEgp }
    })

    const updatedUser = await db.user.findUnique({ where: { id: user.id } })

    // Push real-time balance updates to BOTH parties
    await pushBalanceUpdates([user.id, result.p2pTrade.buyerId === user.id ? result.p2pTrade.sellerId : result.p2pTrade.buyerId])

    // Notify the counterparty that someone took their offer
    const counterpartyId = result.p2pTrade.buyerId === user.id
      ? result.p2pTrade.sellerId
      : result.p2pTrade.buyerId
    const _counterpartyRole = result.p2pTrade.buyerId === user.id ? 'البائع' : 'المشتري'
    const myRole = result.p2pTrade.buyerId === user.id ? 'المشتري' : 'البائع'
    await createNotification({
      userId: counterpartyId,
      type: 'P2P',
      title: '🔔 صفقة P2P جديدة',
      message: `قام ${myRole} بأخذ عرضك. الكمية: ${result.usdt} USDT، المبلغ: ${result.egp} جنيه. بانتظار ${result.p2pTrade.buyerId === counterpartyId ? 'دفعك' : 'دفع المشتري'}.`,
      metadata: {
        tradeId: result.p2pTrade.id,
        usdtAmount: result.usdt,
        egpAmount: result.egp,
        action: 'TAKEN',
      },
    })

    // Push real-time P2P event so offer owner's UI refreshes
    await pushP2pEvent(counterpartyId, {
      type: 'OFFER_TAKEN',
      tradeId: result.p2pTrade.id,
      offerId: result.p2pTrade.offerId,
      usdtAmount: result.usdt,
      egpAmount: result.egp,
    })

    // Post system message to chat (trade created lifecycle event)
    await postSystemMessage(
      result.p2pTrade.id,
      SYSTEM_MESSAGES.tradeCreated(result.usdt, result.egp, Number(result.p2pTrade.priceEgp)),
      { buyerId: result.p2pTrade.buyerId, sellerId: result.p2pTrade.sellerId },
    )

    return NextResponse.json({
      trade: {
        id: result.p2pTrade.id,
        usdtAmount: result.usdt,
        egpAmount: result.egp,
        feeEgp: result.feeEgp,
        status: result.p2pTrade.status,
        paymentMethod: result.p2pTrade.paymentMethod,
        createdAt: result.p2pTrade.createdAt,
      },
      balances: {
        egpBalance: updatedUser ? Number(updatedUser.egpBalance) : 0,
        usdtBalance: updatedUser ? Number(updatedUser.usdtBalance) : 0,
      },
      message: 'تم إنشاء الصفقة. ادفع للطرف الآخر ثم اضغط "أكدت الدفع"',
    })
  } catch (e: any) {
    console.error('P2P trade create error:', e)
    const msg = e?.message || 'حدث خطأ غير متوقع'
    const map: Record<string, { msg: string; status: number }> = {
      OFFER_NOT_FOUND: { msg: 'الإعلان غير موجود', status: 404 },
      OFFER_NOT_ACTIVE: { msg: 'الإعلان لم يعد متاحاً', status: 400 },
      CANNOT_TRADE_WITH_SELF: { msg: 'لا يمكن التداول مع نفسك', status: 400 },
      PAYMENT_METHOD_NOT_ALLOWED: { msg: 'طريقة الدفع غير مدعومة في هذا الإعلان', status: 400 },
      AMOUNT_REQUIRED: { msg: 'حدد كمية USDT أو مبلغ الجنيه', status: 400 },
      INVALID_AMOUNT: { msg: 'المبالغ غير صحيحة', status: 400 },
      EXCEEDS_OFFER_AMOUNT: { msg: 'الكمية تتجاوز المتاح في الإعلان', status: 400 },
      OUT_OF_RANGE: { msg: 'المبلغ خارج حدود الإعلان', status: 400 },
      INSUFFICIENT_EGP_BALANCE: { msg: 'رصيد الجنيه غير كافٍ', status: 400 },
      INSUFFICIENT_USDT_BALANCE: { msg: 'رصيد USDT غير كافٍ', status: 400 },
      USER_NOT_FOUND: { msg: 'المستخدم غير موجود', status: 404 },
    }
    const mapped = map[msg] || { msg: 'حدث خطأ غير متوقع', status: 500 }
    return NextResponse.json({ error: mapped.msg }, { status: mapped.status })
  }
}

// PATCH: update trade status (mark paid, release, cancel)
export async function PATCH(req: NextRequest) {
  try {
    // All P2P trade mutations (MARK_PAID / RELEASE / CANCEL / DISPUTE) require
    // verified email/phone if admin enforces it. Previously only POST (create)
    // was gated, leaving PATCH exploitable by unverified users.
    const verifyError = await requireVerified(req)
    if (verifyError) return verifyError

    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { tradeId, action, paymentReference, receiptImage } = body
    // action: MARK_PAID | RELEASE | CANCEL | DISPUTE

    if (!tradeId || !action) {
      return NextResponse.json({ error: 'معرف الصفقة والإجراء مطلوبان' }, { status: 400 })
    }

    const trade = await db.p2pTrade.findUnique({
      where: { id: tradeId },
      include: { offer: true },
    })
    if (!trade) return NextResponse.json({ error: 'الصفقة غير موجودة' }, { status: 404 })

    const isBuyer = trade.buyerId === user.id
    const isSeller = trade.sellerId === user.id
    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    if (action === 'MARK_PAID') {
      if (!isBuyer) return NextResponse.json({ error: 'فقط المشتري يؤكد الدفع' }, { status: 403 })
      if (trade.status !== 'PENDING_PAYMENT') {
        return NextResponse.json({ error: 'الصفقة في حالة غير صحيحة' }, { status: 400 })
      }

      // Optional: save receipt image (base64 → /uploads/ OUTSIDE public/)
      // SECURITY: Receipts contain PII. Stored outside /public/ and served
      // via authenticated /api/uploads/p2p-receipts/[filename] route.
      let receiptPath: string | null = null
      if (receiptImage && typeof receiptImage === 'string' && receiptImage.length > 100) {
        try {
          const base64Data = receiptImage.replace(/^data:image\/\w+;base64,/, '')
          const buffer = Buffer.from(base64Data, 'base64')
          const filename = `p2p-${tradeId}-${Date.now()}.png`
          const fs = await import('fs')
          const path = await import('path')
          const uploadDir = path.join(process.cwd(), 'uploads', 'p2p-receipts')
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
          }
          fs.writeFileSync(path.join(uploadDir, filename), buffer)
          receiptPath = `/api/uploads/p2p-receipts/${filename}`
        } catch (e) {
          console.error('P2P receipt upload error:', e)
        }
      }

      await db.p2pTrade.update({
        where: { id: tradeId },
        data: {
          status: 'PAID',
          paymentReference: receiptPath || paymentReference || null,
          paidAt: new Date(),
        },
      })

      // Notify seller that buyer has paid
      await createNotification({
        userId: trade.sellerId,
        type: 'P2P',
        title: '💰 تم تأكيد الدفع',
        message: `أكّد المشتري دفع ${Number(trade.egpAmount)} جنيه لصفقة ${Number(trade.usdtAmount)} USDT. تحقق من وصول المبلغ ثم اضغط "إفراج عن USDT".`,
        metadata: {
          tradeId: trade.id,
          usdtAmount: Number(trade.usdtAmount),
          egpAmount: Number(trade.egpAmount),
          action: 'MARK_PAID',
        },
      })

      // Push real-time P2P event so seller's UI refreshes
      await pushP2pEvent(trade.sellerId, {
        type: 'TRADE_PAID',
        tradeId: trade.id,
        usdtAmount: Number(trade.usdtAmount),
        egpAmount: Number(trade.egpAmount),
      })

      // Post system message: buyer marked paid
      await postSystemMessage(
        trade.id,
        SYSTEM_MESSAGES.buyerMarkedPaid(Number(trade.egpAmount), trade.paymentMethod),
        { buyerId: trade.buyerId, sellerId: trade.sellerId },
      )

      // Email the seller: buyer has paid
      sendEmail(trade.sellerId, 'p2p', EMAIL_TEMPLATES.p2pTradeUpdate(
        'PAID', Number(trade.usdtAmount),
        `أكد المشتري دفع ${Number(trade.egpAmount)} جنيه. يرجى التحقق والتأكيد.`,
      )).catch(() => {})

      return NextResponse.json({ success: true, message: 'تم تأكيد الدفع، بانتظار إفراج البائع' })
    }

    if (action === 'RELEASE') {
      if (!isSeller) return NextResponse.json({ error: 'فقط البائع يفرج' }, { status: 403 })
      // SECURITY: Seller can only release AFTER buyer has marked payment as paid.
      // Previously this also allowed RELEASE from PENDING_PAYMENT (buyer hadn't
      // even clicked "I paid"), which let a seller be socially engineered into
      // releasing USDT before verifying they received the EGP off-platform.
      if (trade.status !== 'PAID') {
        return NextResponse.json({ error: 'لا يمكن الإفراج قبل تأكيد المشتري للدفع' }, { status: 400 })
      }

      // Settlement:
      // - Buyer's held EGP (egp + feePerSide) is released to seller (egp - feePerSide) and platform keeps the fee
      // - Seller's escrowed USDT goes to buyer
      const feePerSide = roundEgp(Number(trade.feeEgp) / 2)
      const _totalBuyerHeldEgp = roundEgp(Number(trade.egpAmount) + feePerSide)
      const sellerReceivableEgp = roundEgp(Number(trade.egpAmount) - feePerSide)
      const usdtAmount = Number(trade.usdtAmount)

      await db.$transaction(async (tx) => {
        // Credit seller EGP (minus fee)
        const seller = await tx.user.findUnique({ where: { id: trade.sellerId } })
        if (!seller) throw new Error('SELLER_NOT_FOUND')
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
            description: `استلام EGP من صفقة P2P (${trade.id})`,
            referenceId: trade.id,
            referenceType: 'P2P_TRADE',
          },
        })

        // Credit buyer USDT
        const buyer = await tx.user.findUnique({ where: { id: trade.buyerId } })
        if (!buyer) throw new Error('BUYER_NOT_FOUND')
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
            description: `استلام USDT من صفقة P2P (${trade.id})`,
            referenceId: trade.id,
            referenceType: 'P2P_TRADE',
          },
        })

        await tx.p2pTrade.update({
          where: { id: tradeId },
          data: {
            status: 'RELEASED',
            releasedAt: new Date(),
          },
        })
      })

      const updatedUser = await db.user.findUnique({ where: { id: user.id } })

      // Push real-time balance updates to BOTH parties
      await pushBalanceUpdates([trade.buyerId, trade.sellerId])

      // Notify buyer that USDT has been released
      await createNotification({
        userId: trade.buyerId,
        type: 'P2P',
        title: '✅ تم استلام USDT',
        message: `أفرج البائع عن ${usdtAmount} USDT في صفقتك. تم إيداعها في محفظتك. الصفقة مكتملة.`,
        metadata: {
          tradeId: trade.id,
          usdtAmount,
          egpAmount: Number(trade.egpAmount),
          action: 'RELEASED',
        },
      })

      // Push real-time P2P event so buyer's UI refreshes + shows review form
      await pushP2pEvent(trade.buyerId, {
        type: 'TRADE_RELEASED',
        tradeId: trade.id,
        usdtAmount,
        egpAmount: Number(trade.egpAmount),
      })

      // Post system message: seller released USDT
      await postSystemMessage(
        trade.id,
        SYSTEM_MESSAGES.sellerReleased(usdtAmount),
        { buyerId: trade.buyerId, sellerId: trade.sellerId },
      )

      // Email the buyer: USDT has been released
      sendEmail(trade.buyerId, 'p2p', EMAIL_TEMPLATES.p2pTradeUpdate(
        'RELEASED', usdtAmount,
        `أفرج البائع عن ${usdtAmount} USDT. تم إيداعها في محفظتك.`,
      )).catch(() => {})

      return NextResponse.json({
        success: true,
        balances: {
          egpBalance: updatedUser ? Number(updatedUser.egpBalance) : 0,
          usdtBalance: updatedUser ? Number(updatedUser.usdtBalance) : 0,
        },
        message: 'تم إفراج عن USDT بنجاح. الصفقة مكتملة',
      })
    }

    if (action === 'CANCEL') {
      if (trade.status === 'RELEASED') {
        return NextResponse.json({ error: 'لا يمكن إلغاء صفقة مكتملة' }, { status: 400 })
      }

      // Define these outside the transaction so they're accessible in the notification
      const cancelFeePerSide = roundEgp(Number(trade.feeEgp) / 2)
      const cancelTotalBuyerHeldEgp = roundEgp(Number(trade.egpAmount) + cancelFeePerSide)
      const cancelUsdtAmount = Number(trade.usdtAmount)

      await db.$transaction(async (tx) => {
        // Refund: if SELL offer (seller escrowed), return USDT to offer pool + return buyer's EGP
        // If BUY offer (taker escrowed), return USDT to seller + return buyer's EGP
        const _feePerSide = cancelFeePerSide
        const totalBuyerHeldEgp = cancelTotalBuyerHeldEgp
        const usdtAmount = cancelUsdtAmount

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
              description: `استرجاع EGP من إلغاء صفقة P2P (${trade.id})`,
              referenceId: trade.id,
              referenceType: 'P2P_TRADE_REFUND',
            },
          })
        }

        // Refund USDT to seller
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
              description: `استرجاع USDT من إلغاء صفقة P2P (${trade.id})`,
              referenceId: trade.id,
              referenceType: 'P2P_TRADE_REFUND',
            },
          })
        }

        // Restore offer (if it was reduced)
        const offer = await tx.p2pOffer.findUnique({ where: { id: trade.offerId } })
        if (offer && offer.status === 'ACTIVE') {
          await tx.p2pOffer.update({
            where: { id: offer.id },
            data: {
              usdtAmount: roundUsdt(Number(offer.usdtAmount) + usdtAmount),
            },
          })
        }

        await tx.p2pTrade.update({
          where: { id: tradeId },
          data: { status: 'CANCELLED' },
        })
      })

      const updatedUser = await db.user.findUnique({ where: { id: user.id } })

      // Push real-time balance updates to BOTH parties (both got refunds)
      await pushBalanceUpdates([trade.buyerId, trade.sellerId])

      // Notify both parties about the cancellation + refund
      const notifyUser = async (userId: string, role: string) => {
        await createNotification({
          userId,
          type: 'P2P',
          title: '❌ تم إلغاء الصفقة',
          message: `تم إلغاء صفقة ${cancelUsdtAmount} USDT. تم استرجاع أموالك (${role === 'BUYER' ? `${cancelTotalBuyerHeldEgp} جنيه` : `${cancelUsdtAmount} USDT`}).`,
          metadata: {
            tradeId: trade.id,
            usdtAmount: cancelUsdtAmount,
            egpAmount: Number(trade.egpAmount),
            action: 'CANCELLED',
            refund: true,
          },
        })
      }
      await notifyUser(trade.buyerId, 'BUYER')
      await notifyUser(trade.sellerId, 'SELLER')

      // Push real-time P2P event so both parties' UI refreshes
      await pushP2pEvents([trade.buyerId, trade.sellerId], {
        type: 'TRADE_CANCELLED',
        tradeId: trade.id,
        usdtAmount: cancelUsdtAmount,
        egpAmount: Number(trade.egpAmount),
      })

      // Post system message: trade cancelled
      const cancelReason = isBuyer ? 'بواسطة المشتري' : 'بواسطة البائع'
      await postSystemMessage(
        trade.id,
        SYSTEM_MESSAGES.tradeCancelled(cancelReason),
        { buyerId: trade.buyerId, sellerId: trade.sellerId },
      )

      // Email both parties: trade cancelled
      sendEmail(trade.buyerId, 'p2p', EMAIL_TEMPLATES.p2pTradeUpdate(
        'CANCELLED', cancelUsdtAmount,
        `تم إلغاء الصفقة ${cancelReason}. تم استرجاع الأموال.`,
      )).catch(() => {})
      sendEmail(trade.sellerId, 'p2p', EMAIL_TEMPLATES.p2pTradeUpdate(
        'CANCELLED', cancelUsdtAmount,
        `تم إلغاء الصفقة ${cancelReason}. تم استرجاع الأموال.`,
      )).catch(() => {})

      return NextResponse.json({
        success: true,
        balances: {
          egpBalance: updatedUser ? Number(updatedUser.egpBalance) : 0,
          usdtBalance: updatedUser ? Number(updatedUser.usdtBalance) : 0,
        },
        message: 'تم إلغاء الصفقة واسترجاع الأموال',
      })
    }

    if (action === 'DISPUTE') {
      if (trade.status !== 'PAID' && trade.status !== 'PENDING_PAYMENT') {
        return NextResponse.json({ error: 'لا يمكن فتح نزاع على صفقة في هذه الحالة' }, { status: 400 })
      }
      // Dispute reason/description are optional but recommended
      const { reason, description } = body as { reason?: string; description?: string }

      // Check if a dispute already exists for this trade
      const existingDispute = await db.p2pDispute.findFirst({
        where: { tradeId, status: { in: ['OPEN', 'UNDER_REVIEW'] } },
      })
      if (existingDispute) {
        return NextResponse.json({ error: 'يوجد نزاع مفتوح بالفعل على هذه الصفقة' }, { status: 400 })
      }

      await db.$transaction([
        db.p2pTrade.update({
          where: { id: tradeId },
          data: {
            status: 'DISPUTED',
            disputedAt: new Date(),
          },
        }),
        db.p2pDispute.create({
          data: {
            tradeId,
            openedById: user.id,
            reason: reason || 'OTHER',
            description: description || '—',
            status: 'OPEN',
          },
        }),
      ])

      // Notify both parties + admins
      const otherId = isBuyer ? trade.sellerId : trade.buyerId
      await createNotification({
        userId: otherId,
        type: 'P2P',
        title: '⚠️ تم فتح نزاع',
        message: `تم فتح نزاع على صفقة ${Number(trade.usdtAmount)} USDT. سيتم مراجعة الأمر من الإدارة.`,
        metadata: { tradeId: trade.id, action: 'view_p2p' },
      })

      // Notify admins
      const admins = await db.user.findMany({ where: { role: 'ADMIN', status: 'ACTIVE' } })
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          type: 'P2P',
          title: '⚠️ نزاع P2P يحتاج مراجعة',
          message: `نزاع على صفقة ${Number(trade.usdtAmount)} USDT بين ${user.name} والطرف الآخر.`,
          metadata: { tradeId: trade.id, action: 'admin_p2p' },
        })
      }

      // Push real-time P2P event so the counterparty's UI refreshes
      await pushP2pEvent(otherId, {
        type: 'DISPUTE_OPENED',
        tradeId: trade.id,
        usdtAmount: Number(trade.usdtAmount),
      })

      // Post system message: dispute opened
      const reasonLabels: Record<string, string> = {
        NO_PAYMENT: 'المشتري لم يدفع',
        NO_RELEASE: 'البائع لم يفرج',
        OTHER: 'سبب آخر',
      }
      const openerRole = isBuyer ? 'المشتري' : 'البائع'
      await postSystemMessage(
        trade.id,
        SYSTEM_MESSAGES.disputeOpened(reasonLabels[reason || 'OTHER'] || 'سبب آخر', openerRole),
        { buyerId: trade.buyerId, sellerId: trade.sellerId },
      )

      // Email both parties: dispute opened
      sendEmail(trade.buyerId, 'p2p', EMAIL_TEMPLATES.p2pTradeUpdate(
        'DISPUTED', Number(trade.usdtAmount),
        `تم فتح نزاع بواسطة ${openerRole}. الإدارة ستراجع الأمر.`,
      )).catch(() => {})
      sendEmail(trade.sellerId, 'p2p', EMAIL_TEMPLATES.p2pTradeUpdate(
        'DISPUTED', Number(trade.usdtAmount),
        `تم فتح نزاع بواسطة ${openerRole}. الإدارة ستراجع الأمر.`,
      )).catch(() => {})

      return NextResponse.json({ success: true, message: 'تم فتح النزاع. ستتم مراجعته من الإدارة.' })
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 })
  } catch (e) {
    console.error('P2P trade update error:', e)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}
