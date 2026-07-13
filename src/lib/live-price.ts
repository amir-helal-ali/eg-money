// Server-side helper to fetch the live ticker price from the ticker-service.
// Used by API routes (e.g., /api/trades) so they use the SAME live live market
// price that the frontend shows via WebSocket.

import { tickerGet } from '@/lib/ticker-client'

export type LivePrice = {
  buyPriceEgp: number
  sellPriceEgp: number
  askPriceEgp: number
  bidPriceEgp: number
  spread: number
  change24h: number
  change24hAbs: number
  open24h: number
  high24h: number
  low24h: number
  source: 'live' | 'fallback'
  timestamp: number
}

let cache: { data: LivePrice | null; at: number } = { data: null, at: 0 }
const CACHE_TTL_MS = 3000 // 3 seconds — fresh enough for trades, avoids hammering the service

export async function getLivePrice(): Promise<LivePrice | null> {
  const now = Date.now()
  if (cache.data && now - cache.at < CACHE_TTL_MS) {
    return cache.data
  }

  // /price is a public endpoint on the ticker-service (no secret required).
  // tickerGet handles the timeout via AbortController.
  const data = await tickerGet<LivePrice>('/price')
  if (data) {
    cache = { data, at: now }
    return data
  }
  // Service unavailable — return stale cache if we have one, else null
  return cache.data
}
