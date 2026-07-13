import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'
import { safeJsonParse } from '@/lib/safe-json'
import { rateLimitOr429 } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Anti-scraping rate limit: 60 req/min per user
  const rl = rateLimitOr429(user.id, 'notifications')
  if (rl) {
    return NextResponse.json({ error: rl.error }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } })
  }

  const url = new URL(req.url)
  const limit = Number(url.searchParams.get('limit') || 20)

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  const unreadCount = await db.notification.count({
    where: { userId: user.id, read: false },
  })

  return NextResponse.json({
    notifications: notifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      metadata: safeJsonParse(n.metadata, null),
      createdAt: n.createdAt,
    })),
    unreadCount,
  })
}
