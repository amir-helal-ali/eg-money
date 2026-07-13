import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const alerts = await db.priceAlert.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({
    alerts: alerts.map(a => ({
      id: a.id,
      condition: a.condition,
      targetPrice: Number(a.targetPrice),
      currentPrice: Number(a.currentPrice),
      status: a.status,
      createdAt: a.createdAt,
      triggeredAt: a.triggeredAt,
    })),
  })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { condition, targetPrice } = body

  if (!condition || (condition !== 'ABOVE' && condition !== 'BELOW')) {
    return NextResponse.json({ error: 'Invalid condition' }, { status: 400 })
  }

  const price = Number(targetPrice)
  if (!isFinite(price) || price < 30 || price > 100) {
    return NextResponse.json({ error: 'Invalid price (30-100 EGP)' }, { status: 400 })
  }

  const alert = await db.priceAlert.create({
    data: {
      userId: user.id,
      condition,
      targetPrice: price,
    },
  })

  return NextResponse.json({
    alert: {
      id: alert.id,
      condition: alert.condition,
      targetPrice: Number(alert.targetPrice),
      status: alert.status,
      createdAt: alert.createdAt,
    },
    message: 'Price alert created',
  })
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const alertId = url.searchParams.get('id')
  if (!alertId) return NextResponse.json({ error: 'Alert ID required' }, { status: 400 })

  const alert = await db.priceAlert.findUnique({ where: { id: alertId } })
  if (!alert) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (alert.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await db.priceAlert.update({
    where: { id: alertId },
    data: { status: 'CANCELLED' },
  })

  return NextResponse.json({ success: true })
}
