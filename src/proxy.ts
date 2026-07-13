import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy — runs on every request before the route handler.
 * (Renamed from middleware.ts per Next.js 16 convention)
 *
 * Responsibilities:
 * 1. Security headers (CSP, X-Frame-Options, X-Content-Type-Options, etc.)
 * 2. Basic rate limiting on auth endpoints (in-memory, per-IP)
 * 3. HTTPS redirect in production
 */

// ===== Security headers =====
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-DNS-Prefetch-Control': 'on',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-XSS-Protection': '1; mode=block',
  // CSP allows inline styles (Next.js requires them), inline scripts (dev),
  // images from self + data: + blob:, and connects to localhost (WebSocket).
  // Includes report-uri for monitoring violations (configure CSP_REPORT_URI
  // env var to collect reports — e.g., https://your-report-collector.example).
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' ws: wss: http://localhost:* https:",
    "media-src 'self' data: blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // Report violations to a collector endpoint (optional — set CSP_REPORT_URI)
    ...(process.env.CSP_REPORT_URI ? [`report-uri ${process.env.CSP_REPORT_URI}`] : []),
  ].join('; '),
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
}

// ===== Rate limiting (in-memory, per-IP) =====
// Limits for sensitive auth endpoints to prevent brute-force attacks.
const RATE_LIMITS: Record<string, { window: number; max: number }> = {
  '/api/auth/login': { window: 15 * 60 * 1000, max: 20 }, // 20 per 15 min
  '/api/auth/signup': { window: 60 * 60 * 1000, max: 5 }, // 5 per hour
  '/api/auth/forgot-password': { window: 60 * 60 * 1000, max: 5 },
  '/api/auth/verify-otp': { window: 5 * 60 * 1000, max: 10 },
  '/api/auth/verify-email/confirm': { window: 5 * 60 * 1000, max: 10 },
  '/api/auth/verify-phone/confirm': { window: 5 * 60 * 1000, max: 10 },
}

const ipHits = new Map<string, Map<string, number[]>>() // endpoint → IP → timestamps

// Periodic sweep counter — every ~1000 requests, sweep stale IP entries
// to prevent the outer Map from growing unbounded with stale IPs.
let sweepCounter = 0
const SWEEP_INTERVAL = 1000

function sweepStaleIps() {
  const now = Date.now()
  for (const [endpoint, endpointMap] of ipHits.entries()) {
    const config = RATE_LIMITS[endpoint]
    if (!config) continue
    for (const [ip, hits] of endpointMap.entries()) {
      // Remove IPs whose all hits are older than the window
      const validHits = hits.filter((t) => now - t < config.window)
      if (validHits.length === 0) {
        endpointMap.delete(ip)
      } else {
        endpointMap.set(ip, validHits)
      }
    }
    // Remove empty endpoint maps
    if (endpointMap.size === 0) {
      ipHits.delete(endpoint)
    }
  }
}

function checkRateLimit(endpoint: string, ip: string): { allowed: boolean; retryAfter?: number } {
  const config = RATE_LIMITS[endpoint]
  if (!config) return { allowed: true }

  // Periodic sweep (amortized cleanup — O(1) per request, full sweep every N)
  sweepCounter++
  if (sweepCounter >= SWEEP_INTERVAL) {
    sweepCounter = 0
    sweepStaleIps()
  }

  if (!ipHits.has(endpoint)) ipHits.set(endpoint, new Map())
  const endpointMap = ipHits.get(endpoint)!
  const now = Date.now()
  const hits = endpointMap.get(ip) || []

  // Prune old hits
  const validHits = hits.filter((t) => now - t < config.window)

  if (validHits.length >= config.max) {
    const oldestHit = Math.min(...validHits)
    const retryAfter = Math.ceil((config.window - (now - oldestHit)) / 1000)
    return { allowed: false, retryAfter }
  }

  validHits.push(now)
  endpointMap.set(ip, validHits)
  return { allowed: true }
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const xri = req.headers.get('x-real-ip')
  if (xri) return xri.trim()
  return 'unknown'
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const res = NextResponse.next()

  // 1. Apply security headers to ALL responses
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(key, value)
  }

  // 2. Rate limit sensitive auth endpoints
  const rateLimitConfig = RATE_LIMITS[pathname]
  if (rateLimitConfig && (req.method === 'POST' || req.method === 'GET')) {
    const ip = getClientIp(req)
    const { allowed, retryAfter } = checkRateLimit(pathname, ip)
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'تم تجاوز عدد المحاولات المسموح. حاول لاحقاً.',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter || 60),
            ...SECURITY_HEADERS,
          },
        },
      )
    }
  }

  // 3. HTTPS redirect in production (skip for localhost / preview domains)
  const protocol = req.headers.get('x-forwarded-proto') || ''
  if (
    process.env.NODE_ENV === 'production' &&
    protocol === 'http' &&
    !req.nextUrl.hostname.includes('localhost') &&
    !req.nextUrl.hostname.includes('preview')
  ) {
    const httpsUrl = req.nextUrl.clone()
    httpsUrl.protocol = 'https'
    return NextResponse.redirect(httpsUrl, 301)
  }

  return res
}

export const config = {
  // Run on all routes except static files in /_next and /brand
  matcher: [
    '/((?!_next/static|_next/image|brand|favicon.ico|manifest.json|robots.txt|sw.js).*)',
  ],
}
