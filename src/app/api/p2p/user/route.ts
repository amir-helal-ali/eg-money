import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/p2p/user?userId=xxx — public P2P profile for any user
// Returns: identity, verification status, reputation stats, recent reviews,
// and per-offer-type stats (BUY/SELL counts + volume).
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const userId = url.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId مطلوب' }, { status: 400 })

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      createdAt: true,
      emailVerified: true,
      phoneVerified: true,
      p2pTradesCount: true,
      p2pRatingSum: true,
      p2pRatingCount: true,
    },
  })

  if (!user) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })

  // Recent reviews (last 20) — only the ones received by this user
  const reviews = await db.p2pReview.findMany({
    where: { reviewedId: userId },
    include: {
      reviewer: { select: { id: true, name: true, username: true } },
      trade: { select: { usdtAmount: true, egpAmount: true, priceEgp: true, createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  // Aggregate stats: trades as buyer vs seller
  const trades = await db.p2pTrade.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }],
      status: 'RELEASED',
    },
    select: {
      buyerId: true,
      sellerId: true,
      usdtAmount: true,
      egpAmount: true,
      createdAt: true,
    },
  })

  const asBuyer = trades.filter((t) => t.buyerId === userId)
  const asSeller = trades.filter((t) => t.sellerId === userId)

  // Rating distribution
  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const r of reviews) {
    if (r.rating >= 1 && r.rating <= 5) ratingDistribution[r.rating]++
  }

  const ratingAvg = user.p2pRatingCount > 0 ? user.p2pRatingSum / user.p2pRatingCount : 0

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name || 'مستخدم',
      username: user.username,
      memberSince: user.createdAt,
      verified: user.emailVerified && user.phoneVerified,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
    },
    reputation: {
      ratingAvg: Math.round(ratingAvg * 10) / 10,
      ratingCount: user.p2pRatingCount,
      ratingSum: user.p2pRatingSum,
      ratingDistribution,
      totalTrades: user.p2pTradesCount,
    },
    stats: {
      asBuyer: {
        count: asBuyer.length,
        volumeUsdt: Math.round(asBuyer.reduce((s, t) => s + Number(t.usdtAmount), 0) * 100) / 100,
        volumeEgp: Math.round(asBuyer.reduce((s, t) => s + Number(t.egpAmount), 0) * 100) / 100,
      },
      asSeller: {
        count: asSeller.length,
        volumeUsdt: Math.round(asSeller.reduce((s, t) => s + Number(t.usdtAmount), 0) * 100) / 100,
        volumeEgp: Math.round(asSeller.reduce((s, t) => s + Number(t.egpAmount), 0) * 100) / 100,
      },
    },
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      reviewer: r.reviewer,
      trade: {
        usdtAmount: Number(r.trade.usdtAmount),
        egpAmount: Number(r.trade.egpAmount),
        priceEgp: Number(r.trade.priceEgp),
        createdAt: r.trade.createdAt,
      },
    })),
  })
}
