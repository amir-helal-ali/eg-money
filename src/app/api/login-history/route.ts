import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'
import { safeJsonParse } from '@/lib/safe-json'
import { rateLimitOr429 } from '@/lib/rate-limit'

// GET /api/login-history — list current user's login events
// Query params: limit (default 50, max 200), cursor (createdAt), eventType
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Anti-scraping rate limit: 30 req/min per user
  const rl = rateLimitOr429(user.id, 'login-history')
  if (rl) {
    return NextResponse.json({ error: rl.error }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } })
  }

  const url = new URL(req.url)
  const limit = Math.min(Number(url.searchParams.get('limit') || 50), 200)
  const cursor = url.searchParams.get('cursor')
  const eventType = url.searchParams.get('eventType')

  const where: any = { userId: user.id }
  if (eventType) where.eventType = eventType
  if (cursor) {
    where.createdAt = { lt: new Date(cursor) }
  }

  const [events, total] = await Promise.all([
    db.loginEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    db.loginEvent.count({ where: { userId: user.id } }),
  ])

  // Aggregate stats
  const allEvents = await db.loginEvent.findMany({
    where: { userId: user.id },
    select: { eventType: true, success: true, createdAt: true },
  })
  const stats = {
    totalLogins: allEvents.filter((e) => e.eventType === 'LOGIN' && e.success).length,
    failedAttempts: allEvents.filter((e) => e.eventType === 'FAILED_LOGIN' || !e.success).length,
    lastLogin: allEvents.find((e) => e.eventType === 'LOGIN' && e.success)?.createdAt || null,
    // Failed attempts in last 24h (for "security alert" badge)
    recentFailures: allEvents.filter(
      (e) => !e.success && Date.now() - new Date(e.createdAt).getTime() < 24 * 60 * 60 * 1000,
    ).length,
  }

  const hasNext = events.length === limit
  const nextCursor = hasNext && events.length > 0
    ? events[events.length - 1].createdAt.toISOString()
    : null

  return NextResponse.json({
    total,
    stats,
    events: events.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      success: e.success,
      failureReason: e.failureReason,
      ipAddress: e.ipAddress,
      userAgent: e.userAgent,
      country: e.country,
      city: e.city,
      metadata: safeJsonParse(e.metadata, null),
      createdAt: e.createdAt,
    })),
    pagination: {
      limit,
      hasNext,
      nextCursor,
      count: events.length,
    },
  })
}
