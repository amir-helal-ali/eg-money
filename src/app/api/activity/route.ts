import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Mask a display name for the public activity feed.
 * SECURITY: We must NOT leak emails or full names of users to anonymous viewers.
 * Returns masked form like "Ahmed M." or "User c4f2" (first 4 chars of id).
 *
 * - If the user set a `name`, show "First L." (first name + last initial).
 * - Otherwise fall back to "User <first4>" using their cuid id prefix.
 */
function maskDisplayName(name: string | null, id: string): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) {
      // Single name — show first 2 chars + dot
      return parts[0].slice(0, 2) + '.'
    }
    return `${parts[0]} ${parts[parts.length - 1][0]}.`
  }
  return `User ${id.slice(-4)}`
}

// Public endpoint — returns recent real transactions for the activity feed.
// SECURITY: No auth required; ONLY returns masked user info + amount/type/time.
// Never include full names, emails, phone numbers, or user IDs.
/**
 * Simple in-memory cache for the activity feed.
 * The feed is public + doesn't need to be real-time (delays of a few seconds
 * are fine), so we cache the response for 5 seconds. This dramatically reduces
 * DB load when many users hit the landing page simultaneously.
 *
 * Cache key includes the `limit` query param so different page sizes don't
 * collide. The cache stores the serialized JSON response.
 */
const ACTIVITY_CACHE_TTL_MS = 5_000 // 5 seconds
const activityCache = new Map<string, { at: number; data: { activities: any[]; total: number } }>()

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const limit = Math.min(Number(url.searchParams.get('limit') || 20), 50)

    // ===== Cache check =====
    const cacheKey = String(limit)
    const cached = activityCache.get(cacheKey)
    if (cached && Date.now() - cached.at < ACTIVITY_CACHE_TTL_MS) {
      return NextResponse.json(cached.data)
    }

    // Fetch recent trades (direct buy/sell)
    const trades = await db.trade.findMany({
      where: { status: 'COMPLETED' },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Fetch recent deposits (approved only)
    const deposits = await db.deposit.findMany({
      where: { status: 'APPROVED' },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { processedAt: 'desc' },
      take: limit,
    })

    // Fetch recent withdrawals (approved only)
    const withdrawals = await db.withdrawal.findMany({
      where: { status: 'APPROVED' },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { processedAt: 'desc' },
      take: limit,
    })

    // Fetch recent P2P trades (released only)
    const p2pTrades = await db.p2pTrade.findMany({
      where: { status: 'RELEASED' },
      include: {
        buyer: { select: { id: true, name: true } },
      },
      orderBy: { releasedAt: 'desc' },
      take: limit,
    })

    // Combine and format all activities
    type Activity = {
      type: 'buy' | 'sell' | 'p2p' | 'deposit' | 'withdraw'
      userName: string
      amount: string
      currency: 'USDT' | 'EGP'
      method?: string
      timestamp: number
      isReal: true
    }

    const activities: Activity[] = []

    // Format trades
    for (const t of trades) {
      activities.push({
        type: t.type === 'BUY' ? 'buy' : 'sell',
        userName: maskDisplayName(t.user.name, t.user.id),
        amount: Number(t.usdtAmount).toFixed(2),
        currency: 'USDT',
        timestamp: new Date(t.createdAt).getTime(),
        isReal: true,
      })
    }

    // Format deposits
    for (const d of deposits) {
      activities.push({
        type: 'deposit',
        userName: maskDisplayName(d.user.name, d.user.id),
        amount: Math.round(Number(d.amountEgp)).toString(),
        currency: 'EGP',
        method: d.method,
        timestamp: new Date(d.processedAt || d.createdAt).getTime(),
        isReal: true,
      })
    }

    // Format withdrawals
    for (const w of withdrawals) {
      activities.push({
        type: 'withdraw',
        userName: maskDisplayName(w.user.name, w.user.id),
        amount: Math.round(Number(w.amountEgp)).toString(),
        currency: 'EGP',
        method: w.method,
        timestamp: new Date(w.processedAt || w.createdAt).getTime(),
        isReal: true,
      })
    }

    // Format P2P trades
    for (const p of p2pTrades) {
      // Show from buyer's perspective (they received USDT)
      activities.push({
        type: 'p2p',
        userName: maskDisplayName(p.buyer.name, p.buyer.id),
        amount: Number(p.usdtAmount).toFixed(2),
        currency: 'USDT',
        method: p.paymentMethod,
        timestamp: new Date(p.releasedAt || p.createdAt).getTime(),
        isReal: true,
      })
    }

    // Sort by timestamp (newest first) and limit
    activities.sort((a, b) => b.timestamp - a.timestamp)

    const responseData = {
      activities: activities.slice(0, limit),
      total: activities.length,
    }

    // ===== Cache write =====
    activityCache.set(cacheKey, { at: Date.now(), data: responseData })
    // Best-effort cache cleanup: drop stale entries to prevent unbounded growth
    if (activityCache.size > 20) {
      const now = Date.now()
      for (const [k, v] of activityCache.entries()) {
        if (now - v.at > ACTIVITY_CACHE_TTL_MS * 2) {
          activityCache.delete(k)
        }
      }
    }

    return NextResponse.json(responseData)
  } catch (e) {
    console.error('[activity] Error:', e)
    return NextResponse.json({ activities: [], total: 0 })
  }
}
