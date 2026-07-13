import { createServer } from 'http'
import { Server } from 'socket.io'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const httpServer = createServer()
// SECURITY: Restrict WebSocket CORS to known origins.
// Defaults to localhost for dev; production origin(s) come from ALLOWED_ORIGINS env.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
const io = new Server(httpServer, {
  cors: {
    origin: (origin, cb) => {
      // Allow same-origin (no Origin header, e.g., server-to-server) and allowlisted origins.
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        cb(null, true)
      } else {
        cb(new Error(`Origin ${origin} not allowed`))
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// ===== Paths for persistence =====
const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, 'data')
const PRICE_HISTORY_FILE = join(DATA_DIR, 'price-history.json')
const HOURLY_HISTORY_FILE = join(DATA_DIR, 'hourly-history.json')

if (!existsSync(DATA_DIR)) {
  try { mkdirSync(DATA_DIR, { recursive: true }) } catch {}
}

// ===== Price history tracking =====
// We persist TWO levels of history:
//   1. TICK HISTORY — every price we fetch (every 10s), capped at last 24h.
//      Used for sparkline + intraday stats.
//   2. HOURLY HISTORY — one record per hour (the last price of that hour).
//      Used for the authoritative 24h change%, high, low. Hourly buckets are
//      more stable than raw ticks and survive restarts cleanly.
//
// The 24h change% is computed from the oldest hourly record that is still
// within the last 24h, compared to the latest live price. This matches what
// most exchanges show.

type TickRecord = { t: number; p: number; b: number; s: number } // t=ms, p=mid, b=buy, s=sell
type HourlyRecord = { t: number; o: number; h: number; l: number; c: number; b: number; s: number }
//   t = hour start (ms)
//   o = open (first mid of the hour)
//   h = high (max mid of the hour)
//   l = low (min mid of the hour)
//   c = close (last mid of the hour)
//   b = buy price (highest BUY ad)
//   s = sell price (lowest SELL ad)

const TICK_RETENTION_MS = 24 * 60 * 60 * 1000
const HOURLY_RETENTION_MS = 7 * 24 * 60 * 60 * 1000 // keep 7 days of hourly buckets
const TICK_HISTORY: TickRecord[] = []
const HOURLY_HISTORY: HourlyRecord[] = []

function loadHistory() {
  try {
    if (existsSync(PRICE_HISTORY_FILE)) {
      const raw = readFileSync(PRICE_HISTORY_FILE, 'utf-8')
      const data: TickRecord[] = JSON.parse(raw)
      const cutoff = Date.now() - TICK_RETENTION_MS
      const valid = data.filter(r => r.t > cutoff)
      TICK_HISTORY.push(...valid)
      console.log(`[ticker] Loaded ${valid.length} tick records`)
    }
  } catch (e) {
    console.error('[ticker] Failed to load tick history:', e)
  }
  try {
    if (existsSync(HOURLY_HISTORY_FILE)) {
      const raw = readFileSync(HOURLY_HISTORY_FILE, 'utf-8')
      const data: HourlyRecord[] = JSON.parse(raw)
      const cutoff = Date.now() - HOURLY_RETENTION_MS
      const valid = data.filter(r => r.t > cutoff)
      HOURLY_HISTORY.push(...valid)
      console.log(`[ticker] Loaded ${valid.length} hourly records`)
    }
  } catch (e) {
    console.error('[ticker] Failed to load hourly history:', e)
  }
}

// Debounced saves
let tickSavePending = false
function saveTickHistory() {
  if (tickSavePending) return
  tickSavePending = true
  setTimeout(() => {
    tickSavePending = false
    try {
      writeFileSync(PRICE_HISTORY_FILE, JSON.stringify(TICK_HISTORY))
    } catch (e) {
      console.error('[ticker] Failed to save tick history:', e)
    }
  }, 30000)
}

let hourlySavePending = false
function saveHourlyHistory() {
  if (hourlySavePending) return
  hourlySavePending = true
  setTimeout(() => {
    hourlySavePending = false
    try {
      writeFileSync(HOURLY_HISTORY_FILE, JSON.stringify(HOURLY_HISTORY))
    } catch (e) {
      console.error('[ticker] Failed to save hourly history:', e)
    }
  }, 60000)
}

// Record a new tick + update the current hourly bucket.
function recordTick(mid: number, buy: number, sell: number) {
  const now = Date.now()
  const hourStart = Math.floor(now / 3_600_000) * 3_600_000

  // 1) Push to tick history
  TICK_HISTORY.push({ t: now, p: mid, b: buy, s: sell })
  // Trim old ticks
  const tickCutoff = now - TICK_RETENTION_MS
  while (TICK_HISTORY.length > 0 && TICK_HISTORY[0].t < tickCutoff) {
    TICK_HISTORY.shift()
  }

  // 2) Update the current hourly bucket
  const last = HOURLY_HISTORY[HOURLY_HISTORY.length - 1]
  if (!last || last.t !== hourStart) {
    // New hour → push a new bucket
    HOURLY_HISTORY.push({
      t: hourStart,
      o: mid,
      h: mid,
      l: mid,
      c: mid,
      b: buy,
      s: sell,
    })
  } else {
    // Same hour → update OHLC
    last.h = Math.max(last.h, mid)
    last.l = Math.min(last.l, mid)
    last.c = mid
    last.b = buy
    last.s = sell
  }
  // Trim old hourly buckets
  const hourlyCutoff = now - HOURLY_RETENTION_MS
  while (HOURLY_HISTORY.length > 0 && HOURLY_HISTORY[0].t < hourlyCutoff) {
    HOURLY_HISTORY.shift()
  }

  saveTickHistory()
  saveHourlyHistory()
}

// Compute 24h stats from hourly history (authoritative) + tick history (intraday).
function compute24hStats(currentMid: number): {
  change24h: number
  change24hAbs: number
  high24h: number
  low24h: number
  open24h: number
} {
  const now = Date.now()
  const cutoff = now - 24 * 60 * 60 * 1000

  // Use hourly buckets for the open (oldest in last 24h).
  // For high/low, scan both hourly + ticks in the last 24h to be precise.
  let open24h = currentMid
  let high24h = currentMid
  let low24h = currentMid

  // Open: oldest hourly bucket within 24h
  const hourlyIn24h = HOURLY_HISTORY.filter(h => h.t > cutoff)
  if (hourlyIn24h.length > 0) {
    open24h = hourlyIn24h[0].o
  }

  // High/Low: max/min of all hourly closes + ticks within 24h
  const candidates: number[] = []
  for (const h of hourlyIn24h) {
    candidates.push(h.h, h.l, h.c)
  }
  for (const t of TICK_HISTORY) {
    if (t.t > cutoff) candidates.push(t.p)
  }
  if (candidates.length > 0) {
    high24h = Math.max(...candidates)
    low24h = Math.min(...candidates)
  }

  const change24hAbs = Number((currentMid - open24h).toFixed(2))
  const change24h = open24h > 0
    ? Number(((currentMid - open24h) / open24h * 100).toFixed(2))
    : 0

  return { change24h, change24hAbs, high24h, low24h, open24h }
}

// ===== Market price fetcher — Binance P2P ONLY =====
const MARKET_API_URL = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search'
const FETCH_ROWS = 20
const FETCH_INTERVAL_MS = 10_000
const PLATFORM_SPREAD_EGP = 0.10

type PriceData = {
  buyPriceEgp: number    // what users pay to BUY USDT (highest BUY ad + spread)
  sellPriceEgp: number   // what users get when they SELL USDT (lowest SELL ad - spread)
  askPriceEgp: number    // raw highest BUY ad price (market ask)
  bidPriceEgp: number    // raw lowest SELL ad price (market bid)
  high24h: number
  low24h: number
  open24h: number
  change24h: number
  change24hAbs: number
  volume24h: number
  activeOffers: number
  onlineUsers: number
  tradesToday: number
  usdtTraded: number
  successRate: number
  history: { t: number; p: number }[]
  lastUpdate: number
  source: 'live' | 'fallback'
}

const state: PriceData = {
  buyPriceEgp: 49.60,
  sellPriceEgp: 49.40,
  askPriceEgp: 49.50,
  bidPriceEgp: 49.30,
  high24h: 49.60,
  low24h: 49.20,
  open24h: 49.40,
  change24h: 0.0,
  change24hAbs: 0.0,
  volume24h: 2_400_000,
  activeOffers: 1847,
  onlineUsers: 312,
  tradesToday: 1847,
  usdtTraded: 124580,
  successRate: 99.7,
  history: [],
  lastUpdate: Date.now(),
  source: 'fallback',
}

// Fetch BUY or SELL ads from Binance P2P.
//   tradeType: 'BUY'  → users wanting to BUY USDT (these are SELLERS of USDT)
//                       We want the LOWEST price = best for our users buying
//   tradeType: 'SELL' → users wanting to SELL USDT (these are BUYERS of USDT)
//                       We want the HIGHEST price = best for our users selling
//
// Wait — re-read Binance P2P semantics carefully:
//   On Binance P2P, "BUY" ads are placed by users who want to BUY crypto.
//   "SELL" ads are placed by users who want to SELL crypto.
//   When *I* (a buyer) look at the "BUY" tab, I see ads from sellers — but
//   Binance's API returns ads matching the tradeType filter from the
//   *taker's* perspective. So:
//     - tradeType: 'BUY'  → ads I can take to BUY USDT → these are SELL offers
//                           The price is what I pay. Lowest = best for buyer.
//     - tradeType: 'SELL' → ads I can take to SELL USDT → these are BUY offers
//                           The price is what I receive. Highest = best for seller.
//
// For our platform:
//   - Our "buy" price  = best price a user can buy USDT at = LOWEST 'BUY' ad
//   - Our "sell" price = best price a user can sell USDT at = HIGHEST 'SELL' ad
//
// We fetch FETCH_ROWS=20 ads per side and take the best (lowest buy, highest sell).

async function fetchBinanceP2P(tradeType: 'BUY' | 'SELL'): Promise<{ prices: number[]; count: number }> {
  try {
    const body = JSON.stringify({
      fiat: 'EGP',
      page: 1,
      rows: FETCH_ROWS,
      transAmount: '',
      asset: 'USDT',
      tradeType,
      publisherType: null,
      payTypes: [],
    })

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)

    const res = await fetch(MARKET_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://p2p.binance.com',
        'Referer': 'https://p2p.binance.com/',
      },
      body,
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const json: any = await res.json()
    const data = json?.data || []

    const prices = data
      .map((item: any) => parseFloat(item?.adv?.price || '0'))
      .filter((p: number) => p > 0 && p < 1000)

    return { prices, count: data.length }
  } catch (e) {
    console.error(`[ticker] Binance P2P fetch failed (${tradeType}):`, e instanceof Error ? e.message : e)
    return { prices: [], count: 0 }
  }
}

async function refreshPrices() {
  // BUY tab → prices users can buy USDT at (we want the LOWEST)
  // SELL tab → prices users can sell USDT at (we want the HIGHEST)
  const [buyAdData, sellAdData] = await Promise.all([
    fetchBinanceP2P('BUY'),
    fetchBinanceP2P('SELL'),
  ])

  if (buyAdData.prices.length === 0 && sellAdData.prices.length === 0) {
    state.source = 'fallback'
    return
  }

  // Best buy price = lowest price from BUY ads (user pays the least)
  // Best sell price = highest price from SELL ads (user receives the most)
  const bestBuy = buyAdData.prices.length > 0 ? Math.min(...buyAdData.prices) : state.askPriceEgp
  const bestSell = sellAdData.prices.length > 0 ? Math.max(...sellAdData.prices) : state.bidPriceEgp

  // Sanity: EGP/USDT is typically 40-60
  if (bestBuy < 30 || bestBuy > 100 || bestSell < 30 || bestSell > 100) {
    state.source = 'fallback'
    return
  }

  // Raw market prices
  state.askPriceEgp = Number(bestBuy.toFixed(2))   // lowest ask (best for buyer)
  state.bidPriceEgp = Number(bestSell.toFixed(2))  // highest bid (best for seller)

  // Platform prices with spread
  // User buys at: ask + spread (we charge a bit more)
  // User sells at: bid - spread (we pay a bit less)
  state.buyPriceEgp = Number((state.askPriceEgp + PLATFORM_SPREAD_EGP).toFixed(2))
  state.sellPriceEgp = Number((state.bidPriceEgp - PLATFORM_SPREAD_EGP).toFixed(2))

  // Ensure buy > sell (platform always buys higher than it sells for)
  const MIN_SPREAD = 0.10
  if (state.buyPriceEgp <= state.sellPriceEgp) {
    const mid = (state.buyPriceEgp + state.sellPriceEgp) / 2
    state.buyPriceEgp = Number((mid + MIN_SPREAD / 2).toFixed(2))
    state.sellPriceEgp = Number((mid - MIN_SPREAD / 2).toFixed(2))
  }

  // === Record tick + compute 24h stats from history ===
  const midPrice = Number(((state.buyPriceEgp + state.sellPriceEgp) / 2).toFixed(2))
  recordTick(midPrice, state.buyPriceEgp, state.sellPriceEgp)

  const stats = compute24hStats(midPrice)
  state.change24h = stats.change24h
  state.change24hAbs = stats.change24hAbs
  state.high24h = stats.high24h
  state.low24h = stats.low24h
  state.open24h = stats.open24h

  // Active offers = total ads on both sides (extrapolated from page 1)
  state.activeOffers = (buyAdData.count + sellAdData.count) * 100

  // Volume simulation (small drift) — in production this would come from trade logs
  state.volume24h += Math.floor((Math.random() - 0.3) * 8000)
  state.volume24h = Math.max(2_000_000, state.volume24h)

  state.lastUpdate = Date.now()
  state.source = 'live'

  // Sparkline history (last 30 ticks)
  state.history = TICK_HISTORY.slice(-30).map(h => ({ t: h.t, p: h.p }))

  const spread = (state.buyPriceEgp - state.sellPriceEgp).toFixed(2)
  console.log(
    `[ticker] Binance P2P → ask(lowest BUY ad): ${state.askPriceEgp}, bid(highest SELL ad): ${state.bidPriceEgp} | ` +
    `BUY: ${state.buyPriceEgp}, SELL: ${state.sellPriceEgp} | Spread: ${spread} | ` +
    `24h: ${state.change24h >= 0 ? '+' : ''}${state.change24h}% (${state.change24hAbs >= 0 ? '+' : ''}${state.change24hAbs}) | ` +
    `High: ${state.high24h}, Low: ${state.low24h}, Open: ${state.open24h} | ` +
    `Ticks: ${TICK_HISTORY.length}, Hourly: ${HOURLY_HISTORY.length}`,
  )
}

// ===== Live activity stats simulator =====
const ONLINE_BASELINE = 312
const ONLINE_MIN = 245
const ONLINE_MAX = 420

function updateLiveStats() {
  const drift = (Math.random() - 0.5) * 10
  const isSpike = Math.random() < 0.10
  const isDrop = Math.random() < 0.05

  let delta = drift
  if (isSpike) delta += 15 + Math.random() * 25
  if (isDrop) delta -= 10 + Math.random() * 15

  const reversion = (ONLINE_BASELINE - state.onlineUsers) * 0.05
  delta += reversion

  state.onlineUsers = Math.round(state.onlineUsers + delta)
  state.onlineUsers = Math.max(ONLINE_MIN, Math.min(ONLINE_MAX, state.onlineUsers))

  const offerDelta = Math.round((Math.random() - 0.45) * 30)
  state.activeOffers = Math.max(1500, state.activeOffers + offerDelta)

  const baseTrades = 1 + Math.floor(Math.random() * 3)
  const spikeTrades = Math.random() < 0.15 ? Math.floor(Math.random() * 4) + 2 : 0
  state.tradesToday += baseTrades + spikeTrades

  const volumeGain = Math.floor(3000 + Math.random() * 12000)
  state.volume24h += volumeGain

  const usdtGain = Math.floor(10 + Math.random() * 200)
  state.usdtTraded += usdtGain

  state.successRate = Number((99.7 + (Math.random() - 0.5) * 0.2).toFixed(1))
}

function buildPayload() {
  return {
    buyPriceEgp: state.buyPriceEgp,
    sellPriceEgp: state.sellPriceEgp,
    askPriceEgp: state.askPriceEgp,
    bidPriceEgp: state.bidPriceEgp,
    spread: Number((state.buyPriceEgp - state.sellPriceEgp).toFixed(2)),
    change24h: state.change24h,
    change24hAbs: state.change24hAbs,
    open24h: state.open24h,
    volume24h: state.volume24h,
    high24h: state.high24h,
    low24h: state.low24h,
    activeOffers: state.activeOffers,
    onlineUsers: state.onlineUsers,
    tradesToday: state.tradesToday,
    usdtTraded: state.usdtTraded,
    successRate: state.successRate,
    timestamp: state.lastUpdate,
    source: state.source,
    history: state.history,
  }
}

// ===== Startup =====
loadHistory()
refreshPrices().catch((e) => console.error('[ticker] initial fetch error:', e))
setInterval(refreshPrices, FETCH_INTERVAL_MS)
setInterval(updateLiveStats, 4000)

// Broadcast ticker every 2 seconds
setInterval(() => {
  io.emit('ticker', buildPayload())
}, 2000)

// ===== Price Alerts checker =====
async function checkPriceAlerts() {
  const midPrice = (state.buyPriceEgp + state.sellPriceEgp) / 2
  if (midPrice < 30 || midPrice > 100) return

  try {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret || cronSecret.length < 32) return // skip if not configured
    const res = await fetch('http://localhost:3000/api/price-alerts/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': cronSecret,
      },
      body: JSON.stringify({ currentPrice: midPrice }),
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return
    const data = await res.json() as { triggered: { userId: string; condition: string; targetPrice: number; alertId: string }[] }

    for (const alert of data.triggered) {
      const title = alert.condition === 'ABOVE'
        ? `📈 Price Alert: USDT above ${alert.targetPrice} EGP`
        : `📉 Price Alert: USDT below ${alert.targetPrice} EGP`
      const message = `Current price: ${midPrice.toFixed(2)} EGP — your alert has been triggered!`

      await fetch('http://localhost:3004/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: alert.userId,
          notification: {
            id: `alert-${alert.alertId}-${Date.now()}`,
            type: 'PRICE',
            title,
            message,
            read: false,
            metadata: { alertId: alert.alertId, condition: alert.condition, targetPrice: alert.targetPrice, currentPrice: midPrice },
            createdAt: new Date().toISOString(),
          },
        }),
      }).catch(() => {})
    }

    if (data.triggered.length > 0) {
      console.log(`[ticker] Price alerts triggered: ${data.triggered.length} (price: ${midPrice.toFixed(2)})`)
    }
  } catch {
    // Silently fail — alerts are non-critical
  }
}
setInterval(checkPriceAlerts, 10000)

// ===== P2P expired-trade cleanup =====
// Auto-cancels P2P trades that have been in PENDING_PAYMENT for more than 30 min.
async function cleanupExpiredP2pTrades() {
  try {
    // Skip if CRON_SECRET isn't configured — the endpoint will reject anyway.
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret || cronSecret.length < 32) return
    const res = await fetch('http://localhost:3000/api/p2p/cleanup-expired', {
      method: 'POST',
      headers: { 'x-cron-secret': cronSecret },
    })
    if (res.ok) {
      const data = await res.json()
      if (data.cancelled > 0) {
        console.log(`[ticker] Auto-cancelled ${data.cancelled} expired P2P trades`)
      }
    }
  } catch {
    // Silently fail — cleanup is best-effort
  }
}
setInterval(cleanupExpiredP2pTrades, 60000) // every 1 min

// ===== Notifications via WebSocket =====
const userSockets = new Map<string, Set<string>>()

// Verify a short-lived WS auth token (issued by /api/notifications/ws-token).
// Falls back to the legacy session-token flow for backward compatibility.
async function verifyWsToken(token: string): Promise<string | null> {
  try {
    // Preferred path: POST with { wsToken } body — single-use, short-lived.
    const res = await fetch('http://localhost:3000/api/notifications/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wsToken: token }),
      signal: AbortSignal.timeout(3000),
    })
    if (res.ok) {
      const data = await res.json() as { userId?: string }
      return data.userId ?? null
    }
    // Fallback: legacy GET with session_token cookie (backward compat for
    // older clients that still send the httpOnly cookie value).
    if (res.status === 400) {
      const res2 = await fetch('http://localhost:3000/api/notifications/auth', {
        headers: { Cookie: `session_token=${token}` },
        signal: AbortSignal.timeout(3000),
      })
      if (res2.ok) {
        const data = await res2.json() as { userId?: string }
        return data.userId ?? null
      }
    }
    return null
  } catch {
    return null
  }
}

io.on('connection', (socket) => {
  console.log(`[ticker] client connected: ${socket.id}`)
  socket.emit('ticker', buildPayload())

  socket.on('authenticate', async (data: { token?: string }) => {
    const token = data?.token
    if (!token || typeof token !== 'string') return

    const userId = await verifyWsToken(token)
    if (!userId) {
      socket.emit('auth_error', { message: 'Invalid session' })
      return
    }

    socket.data.userId = userId
    socket.data.token = token
    if (!userSockets.has(userId)) userSockets.set(userId, new Set())
    userSockets.get(userId)!.add(socket.id)
    socket.emit('authenticated', { userId })

    try {
      const res = await fetch(`http://localhost:3000/api/notifications?limit=20`, {
        headers: { Cookie: `session_token=${token}` },
        signal: AbortSignal.timeout(3000),
      })
      if (res.ok) {
        const data = await res.json() as { notifications: any[]; unreadCount: number }
        socket.emit('notifications', data)
      }
    } catch {}
  })

  socket.on('notification:read', async (data: { id?: string }) => {
    const userId = socket.data.userId
    const token = socket.data.token
    if (!userId || !data?.id || !token) return
    try {
      await fetch('http://localhost:3000/api/notifications/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: `session_token=${token}` },
        body: JSON.stringify({ notificationId: data.id }),
      })
    } catch {}
  })

  socket.on('disconnect', () => {
    const userId = socket.data.userId
    if (userId && userSockets.has(userId)) {
      userSockets.get(userId)!.delete(socket.id)
      if (userSockets.get(userId)!.size === 0) userSockets.delete(userId)
    }
    console.log(`[ticker] client disconnected: ${socket.id}`)
  })
})

async function pushNotificationToUser(userId: string, notification: any) {
  const sockets = userSockets.get(userId)
  if (!sockets || sockets.size === 0) return

  for (const socketId of sockets) {
    const socket = io.sockets.sockets.get(socketId)
    if (socket) {
      socket.emit('notification:new', notification)
    }
  }
}

const notifyServer = createServer(async (req, res) => {
  // ===== Public health endpoint (no auth — for Docker healthcheck) =====
  // Returns 200 if the service is alive + the last price fetch succeeded.
  // Used by docker-compose healthcheck to detect ticker-service crashes.
  if (req.method === 'GET' && req.url === '/health') {
    const lastFetchAgo = state.lastUpdate ? Date.now() - state.lastUpdate : null
    const healthy = lastFetchAgo !== null && lastFetchAgo < 60_000 // healthy if updated within 60s
    res.writeHead(healthy ? 200 : 503, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      status: healthy ? 'ok' : 'degraded',
      uptime: process.uptime(),
      lastFetchAgo,
      connectedSockets: io.sockets.sockets.size,
      trackedUsers: userSockets.size,
      price: state.lastUpdate ? {
        buy: state.buyPriceEgp,
        sell: state.sellPriceEgp,
        source: state.source,
      } : null,
    }))
    return
  }

  // ===== Shared-secret auth =====
  // All endpoints except GET /price and GET /health require an `x-internal-secret`
  // header matching the INTERNAL_SECRET env var. This prevents external attackers
  // from pushing fake notifications / balance updates / P2P events.
  // GET /price is intentionally public (read-only, no user data).
  const INTERNAL_SECRET = process.env.INTERNAL_SECRET
  const isPublicPriceEndpoint = req.method === 'GET' && req.url === '/price'

  if (!isPublicPriceEndpoint) {
    if (!INTERNAL_SECRET || INTERNAL_SECRET.length < 32) {
      res.writeHead(503, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'INTERNAL_SECRET not configured (must be ≥32 chars)' }))
      return
    }
    const supplied = req.headers['x-internal-secret']
    if (supplied !== INTERNAL_SECRET) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Unauthorized' }))
      return
    }
  }

  // GET /price — returns the current live ticker payload (for server-side fetch from Next.js API)
  if (isPublicPriceEndpoint) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(buildPayload()))
    return
  }

  if (req.method === 'POST' && req.url === '/notify') {
    let body = ''
    for await (const chunk of req) body += chunk
    try {
      const { userId, notification } = JSON.parse(body)
      if (userId && notification) {
        await pushNotificationToUser(userId, notification)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: true, pushed: userSockets.get(userId)?.size || 0 }))
      } else {
        res.writeHead(400)
        res.end('{"error":"missing userId or notification"}')
      }
    } catch {
      res.writeHead(500)
      res.end('{"error":"invalid json"}')
    }
  } else if (req.method === 'POST' && req.url === '/balance-update') {
    // Push a real-time balance update to a specific user via WebSocket
    let body = ''
    for await (const chunk of req) body += chunk
    try {
      const { userId, balances } = JSON.parse(body)
      if (userId && balances) {
        // Emit to all sockets belonging to this user
        const sockets = userSockets.get(userId)
        if (sockets) {
          for (const socketId of sockets) {
            const socket = io.sockets.sockets.get(socketId)
            if (socket) {
              socket.emit('balance:update', balances)
            }
          }
        }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: true, pushed: sockets?.size || 0 }))
      } else {
        res.writeHead(400)
        res.end('{"error":"missing userId or balances"}')
      }
    } catch {
      res.writeHead(500)
      res.end('{"error":"invalid json"}')
    }
  } else if (req.method === 'POST' && req.url === '/p2p-event') {
    // Push a real-time P2P event to a specific user via WebSocket.
    // Payload: { userId, event: { type, tradeId, ...data } }
    // Event types: NEW_MESSAGE | TRADE_PAID | TRADE_RELEASED | TRADE_CANCELLED |
    //              DISPUTE_OPENED | DISPUTE_RESOLVED | OFFER_TAKEN
    let body = ''
    for await (const chunk of req) body += chunk
    try {
      const { userId, event } = JSON.parse(body)
      if (userId && event?.type) {
        const sockets = userSockets.get(userId)
        let pushed = 0
        if (sockets) {
          for (const socketId of sockets) {
            const socket = io.sockets.sockets.get(socketId)
            if (socket) {
              socket.emit('p2p:event', event)
              pushed++
            }
          }
        }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: true, pushed }))
      } else {
        res.writeHead(400)
        res.end('{"error":"missing userId or event.type"}')
      }
    } catch {
      res.writeHead(500)
      res.end('{"error":"invalid json"}')
    }
  } else if (req.method === 'POST' && req.url === '/online-status') {
    // Check if one or more users are currently online (have active WebSocket connections)
    // Body: { userIds: string[] } → returns { online: { [userId]: boolean } }
    let body = ''
    for await (const chunk of req) body += chunk
    try {
      const { userIds } = JSON.parse(body)
      if (Array.isArray(userIds)) {
        const online: Record<string, boolean> = {}
        for (const userId of userIds) {
          online[userId] = (userSockets.get(userId)?.size || 0) > 0
        }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ online }))
      } else {
        res.writeHead(400)
        res.end('{"error":"userIds array required"}')
      }
    } catch {
      res.writeHead(500)
      res.end('{"error":"invalid json"}')
    }
  } else {
    res.writeHead(404)
    res.end()
  }
})

const NOTIFY_PORT = 3004
notifyServer.listen(NOTIFY_PORT, () => {
  console.log(`[ticker-service] Notification push server on port ${NOTIFY_PORT}`)
})

// Save history on exit
function saveAll() {
  try { writeFileSync(PRICE_HISTORY_FILE, JSON.stringify(TICK_HISTORY)) } catch {}
  try { writeFileSync(HOURLY_HISTORY_FILE, JSON.stringify(HOURLY_HISTORY)) } catch {}
}
process.on('SIGTERM', () => { saveAll(); httpServer.close(() => process.exit(0)) })
process.on('SIGINT', () => { saveAll(); httpServer.close(() => process.exit(0)) })

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`[ticker-service] WebSocket server running on port ${PORT}`)
  console.log(`[ticker-service] Source: Binance P2P API (only)`)
  console.log(`[ticker-service] Fetching every ${FETCH_INTERVAL_MS / 1000}s, ${FETCH_ROWS} ads per side`)
  console.log(`[ticker-service] Tick history: ${PRICE_HISTORY_FILE}`)
  console.log(`[ticker-service] Hourly history: ${HOURLY_HISTORY_FILE}`)
})
