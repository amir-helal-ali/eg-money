/**
 * Internal HTTP client for talking to the ticker-service (port 3004).
 *
 * SECURITY: All endpoints (except GET /price) require an `x-internal-secret`
 * header that matches the INTERNAL_SECRET env var configured on the
 * ticker-service. This prevents external attackers from pushing fake
 * notifications / balance updates / P2P events to users via WebSocket.
 *
 * The secret MUST be set in .env (≥32 chars). If unset, calls silently
 * fail (non-critical) — but the ticker-service itself refuses to start
 * the protected endpoints, so this is defense-in-depth.
 */

const TICKER_BASE_URL = 'http://localhost:3004'
const TIMEOUT_MS = 2000

function getInternalSecret(): string | null {
  const s = process.env.INTERNAL_SECRET
  if (!s || s.length < 32) return null
  return s
}

function internalHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  }
  const secret = getInternalSecret()
  if (secret) {
    headers['x-internal-secret'] = secret
  }
  return headers
}

/**
 * POST to a protected ticker-service endpoint (requires internal secret).
 * Returns the parsed JSON response or null on failure.
 * Times out after TIMEOUT_MS to avoid hanging request handlers.
 */
export async function tickerPost<T = any>(
  path: string,
  body: unknown,
): Promise<T | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const res = await fetch(`${TICKER_BASE_URL}${path}`, {
      method: 'POST',
      headers: internalHeaders(),
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    // Non-critical — caller should degrade gracefully
    return null
  }
}

/**
 * GET from a ticker-service endpoint. For /price (public), no secret is needed.
 * For other GETs (rare), the secret will be added if available.
 */
export async function tickerGet<T = any>(path: string): Promise<T | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const res = await fetch(`${TICKER_BASE_URL}${path}`, {
      method: 'GET',
      headers: internalHeaders(),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}
