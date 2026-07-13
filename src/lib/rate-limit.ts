/**
 * Generic in-memory rate limiter for list/read endpoints.
 *
 * The auth-endpoint rate limiter in proxy.ts is path-specific and stricter.
 * This helper is for general "anti-scraping" protection on list endpoints
 * like /api/transactions, /api/notifications, /api/p2p/offers — prevents
 * a single user from hammering these endpoints thousands of times per minute.
 *
 * Limits are per-userId (authenticated) or per-IP (unauthenticated).
 * Memory is bounded by periodic sweep (every ~1000 calls).
 *
 * Usage:
 *   const rl = checkListRateLimit(userId, 'transactions', { max: 60, windowMs: 60_000 })
 *   if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 */

type RateLimitConfig = {
  /** Max requests allowed in the window. */
  max: number
  /** Window duration in milliseconds. */
  windowMs: number
}

const buckets = new Map<string, { timestamps: number[]; config: RateLimitConfig }>()

let sweepCounter = 0
const SWEEP_INTERVAL = 1000

function sweepStale() {
  const now = Date.now()
  for (const [key, bucket] of buckets.entries()) {
    const valid = bucket.timestamps.filter((t) => now - t < bucket.config.windowMs)
    if (valid.length === 0) {
      buckets.delete(key)
    } else {
      bucket.timestamps = valid
    }
  }
}

/**
 * Check rate limit for a key + endpoint.
 * @returns `{ allowed: true }` or `{ allowed: false, retryAfterSec }`
 */
export function checkListRateLimit(
  key: string,
  endpoint: string,
  config: RateLimitConfig,
): { allowed: true } | { allowed: false; retryAfterSec: number } {
  // Amortized sweep
  sweepCounter++
  if (sweepCounter >= SWEEP_INTERVAL) {
    sweepCounter = 0
    sweepStale()
  }

  const compositeKey = `${endpoint}:${key}`
  const now = Date.now()
  let bucket = buckets.get(compositeKey)

  if (!bucket) {
    bucket = { timestamps: [now], config }
    buckets.set(compositeKey, bucket)
    return { allowed: true }
  }

  // Prune old timestamps
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < config.windowMs)

  if (bucket.timestamps.length >= config.max) {
    const oldest = Math.min(...bucket.timestamps)
    const retryAfterSec = Math.ceil((config.windowMs - (now - oldest)) / 1000)
    return { allowed: false, retryAfterSec }
  }

  bucket.timestamps.push(now)
  return { allowed: true }
}

// ===== Pre-configured limits per endpoint =====

export const LIST_RATE_LIMITS = {
  transactions: { max: 60, windowMs: 60_000 }, // 60/min
  notifications: { max: 60, windowMs: 60_000 }, // 60/min
  'p2p-offers': { max: 120, windowMs: 60_000 }, // 120/min (browsed often)
  'p2p-trades': { max: 60, windowMs: 60_000 }, // 60/min
  'login-history': { max: 30, windowMs: 60_000 }, // 30/min
  'admin-users': { max: 60, windowMs: 60_000 }, // 60/min
  activity: { max: 60, windowMs: 60_000 }, // 60/min (public)
} as const

/**
 * Convenience wrapper: rate-limit an authenticated request by userId.
 * Returns a NextResponse (429) if rate-limited, or null if allowed.
 */
export function rateLimitOr429(
  userId: string,
  endpoint: keyof typeof LIST_RATE_LIMITS,
): null | { error: string; retryAfterSec: number } {
  const config = LIST_RATE_LIMITS[endpoint]
  const result = checkListRateLimit(userId, endpoint, config)
  if (result.allowed) return null
  return {
    error: `طلبات كثيرة جداً. حاول بعد ${result.retryAfterSec} ثانية.`,
    retryAfterSec: result.retryAfterSec,
  }
}
