import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/session'

// GET /api/admin/trades — all user trades
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const url = new URL(req.url)
  const limit = Number(url.searchParams.get('limit') || 100)

  const trades = await db.trade.findMany({
    include: {
      user: { select: { id: true, email: true, name: true, username: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json({
    trades: trades.map((t) => ({
      id: t.id,
      type: t.type,
      usdtAmount: Number(t.usdtAmount),
      egpAmount: Number(t.egpAmount),
      priceEgp: Number(t.priceEgp),
      feeEgp: Number(t.feeEgp),
      status: t.status,
      createdAt: t.createdAt,
      user: t.user,
    })),
    total: trades.length,
  })
}
