import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { lookupGeoIp } from '@/lib/geoip'

/**
 * Extracts client IP from a Next.js request, accounting for common proxy
 * headers (X-Forwarded-For, X-Real-IP, CF-Connecting-IP).
 */
export function getClientIp(req?: NextRequest): string | null {
  if (!req) return null
  // Try common proxy headers
  const xForwardedFor = req.headers.get('x-forwarded-for')
  if (xForwardedFor) {
    // X-Forwarded-For can be a comma-separated list; take the first one
    return xForwardedFor.split(',')[0].trim()
  }
  const xRealIp = req.headers.get('x-real-ip')
  if (xRealIp) return xRealIp.trim()
  const cfConnectingIp = req.headers.get('cf-connecting-ip')
  if (cfConnectingIp) return cfConnectingIp.trim()
  return null
}

/**
 * Logs a login/security event to the database (LoginEvent table).
 * Failures are non-blocking (best-effort logging).
 *
 * Includes GeoIP enrichment (country + city) when the MaxMind GeoLite2
 * database is available. Without the database, country/city are null.
 *
 * @param userId - the user ID (null for failed logins on non-existent users)
 * @param eventType - LOGIN | LOGOUT | FAILED_LOGIN | PASSWORD_RESET | EMAIL_VERIFIED | PHONE_VERIFIED | SESSION_TOKEN_ISSUED
 * @param req - the Next.js request (for IP + user-agent extraction)
 * @param opts - optional fields: success, failureReason, sessionToken, metadata
 */
export async function logLoginEvent(
  userId: string | null,
  eventType: string,
  req?: NextRequest,
  opts?: {
    success?: boolean
    failureReason?: string
    sessionToken?: string
    metadata?: Record<string, any>
  },
) {
  try {
    if (!userId) return // can't log without a user reference

    const ipAddress = getClientIp(req) || null
    const userAgent = req?.headers.get('user-agent') || null

    // GeoIP enrichment (best-effort — returns nulls if DB unavailable)
    const geo = await lookupGeoIp(ipAddress)

    await db.loginEvent.create({
      data: {
        userId,
        eventType,
        success: opts?.success ?? true,
        failureReason: opts?.failureReason || null,
        ipAddress,
        userAgent,
        country: geo.country,
        city: geo.city,
        sessionToken: opts?.sessionToken || null,
        metadata: opts?.metadata ? JSON.stringify(opts.metadata) : null,
      },
    })
  } catch (e) {
    // Non-critical — don't block the login flow
    console.error('[logLoginEvent] error:', e)
  }
}
