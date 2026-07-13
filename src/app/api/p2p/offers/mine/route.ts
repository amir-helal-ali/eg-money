import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'
import { safeJsonParse } from '@/lib/safe-json'

// GET /api/p2p/offers/mine — list the current user's own offers (all statuses)
// Optional query: ?status=ACTIVE | CANCELLED | COMPLETED
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const status = url.searchParams.get('status')

  const where: any = { userId: user.id }
  if (status) where.status = status

  const offers = await db.p2pOffer.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      p2pTrades: {
        select: {
          id: true,
          status: true,
          usdtAmount: true,
          egpAmount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  // Compute per-offer stats
  const result = offers.map((o) => {
    const trades = o.p2pTrades
    const completedTrades = trades.filter((t) => t.status === 'RELEASED').length
    const activeTrades = trades.filter(
      (t) => t.status === 'PENDING_PAYMENT' || t.status === 'PAID',
    ).length
    const totalVolumeUsdt = trades
      .filter((t) => t.status === 'RELEASED')
      .reduce((sum, t) => sum + Number(t.usdtAmount), 0)
    return {
      id: o.id,
      type: o.type,
      usdtAmount: Number(o.usdtAmount),
      originalAmount: Number(o.usdtAmount) + totalVolumeUsdt, // what the user originally listed
      priceEgp: Number(o.priceEgp),
      minOrderEgp: Number(o.minOrderEgp),
      maxOrderEgp: Number(o.maxOrderEgp),
      paymentMethods: safeJsonParse<string[]>(o.paymentMethods, []),
      status: o.status,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      stats: {
        completedTrades,
        activeTrades,
        totalTrades: trades.length,
        totalVolumeUsdt: Math.round(totalVolumeUsdt * 100) / 100,
      },
    }
  })

  return NextResponse.json({ offers: result })
}
