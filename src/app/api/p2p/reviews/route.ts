import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'
import { requireVerified } from '@/lib/verify-guard'

/**
 * POST /api/p2p/reviews — submit a review after trade completion
 * Body: { tradeId, rating (1-5 integer), comment? }
 *
 * SECURITY: requires verified email/phone (if admin enforces it).
 * Validates rating is an integer 1-5 (previously accepted 4.5, NaN).
 * The review creation + reputation update are atomic.
 */
export async function POST(req: NextRequest) {
  // P2P reviews require verified email/phone (if admin enforces it)
  const verifyError = await requireVerified(req)
  if (verifyError) return verifyError

  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { tradeId, rating, comment } = body

  if (!tradeId || rating === undefined || rating === null) {
    return NextResponse.json({ error: 'tradeId and rating required' }, { status: 400 })
  }

  // ===== Strict rating validation =====
  // Must be an integer 1-5. Previously `Number(rating)` accepted 4.5 (Prisma
  // would reject) and NaN (passed the < 1 / > 5 checks).
  const ratingNum = Number(rating)
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json({ error: 'التقييم يجب أن يكون عدداً صحيحاً 1-5' }, { status: 400 })
  }

  const trade = await db.p2pTrade.findUnique({ where: { id: tradeId } })
  if (!trade) return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
  if (trade.buyerId !== user.id && trade.sellerId !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  if (trade.status !== 'RELEASED') {
    return NextResponse.json({ error: 'يمكن التقييم فقط بعد إتمام الصفقة' }, { status: 400 })
  }

  // Determine who is being reviewed (the other party)
  const reviewedId = trade.buyerId === user.id ? trade.sellerId : trade.buyerId

  // ===== Atomic review creation + reputation update =====
  // Use upsert with the @@unique([tradeId, reviewerId]) constraint to prevent
  // race conditions where two concurrent reviews from the same user could
  // both pass the `existing` check. The conditional create + reputation
  // increment happen in one transaction.
  try {
    await db.$transaction(async (tx) => {
      // Try to create — if it exists, the unique constraint throws P2002
      await tx.p2pReview.create({
        data: {
          tradeId,
          reviewerId: user.id,
          reviewedId,
          rating: ratingNum,
          comment: comment?.trim()?.slice(0, 300) || null,
        },
      })

      // Update reviewed user's reputation (atomic increment)
      await tx.user.update({
        where: { id: reviewedId },
        data: {
          p2pRatingSum: { increment: ratingNum },
          p2pRatingCount: { increment: 1 },
        },
      })
    })
  } catch (e: any) {
    // Prisma P2002 = unique constraint violation → already reviewed
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'تم التقييم مسبقاً' }, { status: 400 })
    }
    throw e
  }

  return NextResponse.json({ success: true, message: 'تم إرسال التقييم' })
}

// GET /api/p2p/reviews?userId=xxx — get reviews for a user
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const userId = url.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const reviews = await db.p2pReview.findMany({
    where: { reviewedId: userId },
    include: {
      reviewer: { select: { id: true, name: true, username: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      reviewer: r.reviewer,
    })),
  })
}
