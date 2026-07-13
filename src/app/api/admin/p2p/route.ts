import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/session'
import { safeJsonParse } from '@/lib/safe-json'

// GET /api/admin/p2p — all P2P offers + trades
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const url = new URL(req.url)
  const type = url.searchParams.get('type') // 'offers' | 'trades' | default both

  let offers: any[] = []
  let trades: any[] = []

  if (!type || type === 'offers') {
    const dbOffers = await db.p2pOffer.findMany({
      include: {
        user: { select: { id: true, email: true, name: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    offers = dbOffers.map((o) => ({
      id: o.id,
      type: o.type,
      usdtAmount: Number(o.usdtAmount),
      priceEgp: Number(o.priceEgp),
      minOrderEgp: Number(o.minOrderEgp),
      maxOrderEgp: Number(o.maxOrderEgp),
      paymentMethods: safeJsonParse<string[]>(o.paymentMethods, []),
      status: o.status,
      createdAt: o.createdAt,
      user: o.user,
    }))
  }

  if (!type || type === 'trades') {
    const dbTrades = await db.p2pTrade.findMany({
      include: {
        buyer: { select: { id: true, email: true, name: true, username: true } },
        seller: { select: { id: true, email: true, name: true, username: true } },
        offer: { select: { id: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    trades = dbTrades.map((t) => ({
      id: t.id,
      usdtAmount: Number(t.usdtAmount),
      egpAmount: Number(t.egpAmount),
      priceEgp: Number(t.priceEgp),
      feeEgp: Number(t.feeEgp),
      paymentMethod: t.paymentMethod,
      status: t.status,
      createdAt: t.createdAt,
      releasedAt: t.releasedAt,
      buyer: t.buyer,
      seller: t.seller,
      offer: t.offer,
    }))
  }

  return NextResponse.json({
    offers,
    trades,
    stats: {
      activeOffers: offers.filter((o) => o.status === 'ACTIVE').length,
      completedTrades: trades.filter((t) => t.status === 'RELEASED').length,
      pendingTrades: trades.filter((t) => t.status === 'PENDING_PAYMENT' || t.status === 'PAID').length,
      cancelledTrades: trades.filter((t) => t.status === 'CANCELLED').length,
    },
  })
}
