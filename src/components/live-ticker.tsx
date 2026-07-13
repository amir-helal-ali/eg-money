'use client'

import { useTicker, TickerData } from '@/hooks/use-ticker'
import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'

function fmtEgp(n: number) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}
function fmtNum(n: number) {
  return new Intl.NumberFormat('en-US').format(Math.round(n))
}
function fmtVol(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

/**
 * Live ticker — pulls data from the WebSocket mini-service (live market).
 * No fallback prices: shows live data only, with a "connecting" state while
 * the WebSocket is establishing. Once connected, all numbers are real.
 */
export function LiveTicker({ fallback }: { fallback?: { buyPriceEgp: number; sellPriceEgp: number; p2pFeePercent: number; platformFeePercent: number } }) {
  const { data, connected, connectionState, direction } = useTicker()
  const { t } = useLanguage()

  // Live prices from live market (no static fallbacks)
  const buy = data?.buyPriceEgp ?? 0
  const sell = data?.sellPriceEgp ?? 0
  const change24h = data?.change24h ?? 0
  const volume = data?.volume24h ?? 0
  const activeOffers = data?.activeOffers ?? 0
  const onlineUsers = data?.onlineUsers ?? 0
  const high = data?.high24h ?? 0
  const low = data?.low24h ?? 0

  // While connecting and no data yet, show placeholder dashes
  const hasData = !!data && connected
  const fmt = (n: number) => hasData ? fmtEgp(n) : '—'
  const fmtV = (n: number) => hasData ? fmtVol(n) : '—'
  const fmtN = (n: number) => hasData ? fmtNum(n) : '—'

  // Connection status display
  const statusConfig = {
    connected: { text: t('landing.ticker.connected'), cls: 'bg-success/10 text-success', dot: 'bg-success' },
    connecting: { text: t('landing.ticker.connecting'), cls: 'bg-amber-500/10 text-amber-400', dot: 'bg-amber-400 animate-pulse' },
    reconnecting: { text: t('landing.ticker.reconnecting'), cls: 'bg-amber-500/10 text-amber-400', dot: 'bg-amber-400 animate-pulse' },
    disconnected: { text: t('landing.ticker.disconnected'), cls: 'bg-rose-500/10 text-rose-400', dot: 'bg-rose-400 animate-pulse' },
  }
  const status = statusConfig[connectionState]

  return (
    <div className="relative">
      <div className="relative glass-strong rounded-2xl border border-border/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center font-bold text-primary-foreground">
              ₮
            </div>
            <div>
              <div className="font-bold text-sm">USDT / EGP</div>
              <div className="text-[10px] text-muted-foreground font-num">TETHER · EGP</div>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium ${status.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.text}
          </div>
        </div>

        {/* Big price */}
        <div className="p-5 border-b border-border/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('landing.ticker.lastPrice')}</span>
            <PriceChangeIndicator change={change24h} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`font-num text-4xl font-bold transition-colors ${
              direction === 'up' ? 'text-success' : direction === 'down' ? 'text-rose-400' : 'text-foreground'
            }`}>
              {fmt(buy)}
            </span>
            <span className="text-xs text-muted-foreground font-num">EGP</span>
          </div>
          {/* Mini sparkline */}
          {data?.history && data.history.length > 1 && <Sparkline data={data.history.map(h => h.p)} direction={direction} />}
        </div>

        {/* Buy/Sell prices — buy is HIGHER (user pays more), sell is LOWER (user receives less) */}
        <div className="grid grid-cols-2 divide-x divide-x-reverse divide-border/50">
          <div className="p-4">
            <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider flex items-center gap-1">
              <span>{t('landing.ticker.buy')}</span>
              <span className="text-[9px] opacity-60">{t('landing.ticker.buyHint')}</span>
            </div>
            <div className="font-num text-2xl font-bold text-rose-400">{fmt(buy)}</div>
            <div className="text-[9px] text-muted-foreground font-num mt-0.5">EGP {t('landing.ticker.perUSDT')}</div>
          </div>
          <div className="p-4">
            <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider flex items-center gap-1">
              <span>{t('landing.ticker.sell')}</span>
              <span className="text-[9px] opacity-60">{t('landing.ticker.sellHint')}</span>
            </div>
            <div className="font-num text-2xl font-bold text-success">{fmt(sell)}</div>
            <div className="text-[9px] text-muted-foreground font-num mt-0.5">EGP {t('landing.ticker.perUSDT')}</div>
          </div>
        </div>

        {/* Spread indicator */}
        <div className="px-4 py-2 bg-muted/20 border-t border-border/50 flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">{t('landing.ticker.spread')}</span>
          <span className="font-num font-medium text-primary">
            {fmt(buy - sell)} EGP
            <span className="text-muted-foreground mr-1"> {t('landing.ticker.perUSDT')}</span>
          </span>
        </div>

        {/* Stats */}
        <div className="p-5 border-t border-border/50 grid grid-cols-2 gap-3 text-xs">
          <StatItem label={t('landing.ticker.volume24h')} value={`${fmtV(volume)} EGP`} />
          <StatItem label={t('landing.ticker.change24h')} value={hasData ? `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%` : '—'} up={change24h >= 0} />
          <StatItem label={t('landing.ticker.high24h')} value={fmt(high)} />
          <StatItem label={t('landing.ticker.low24h')} value={fmt(low)} />
          <StatItem label={t('landing.ticker.activeOffers')} value={fmtN(activeOffers)} />
          <StatItem label={t('landing.ticker.onlineUsers')} value={fmtN(onlineUsers)} live />
        </div>

        {/* Footer - fees */}
        <div className="p-5 pt-0 grid grid-cols-2 gap-3 text-xs">
          <div className="flex justify-between p-2 rounded-lg bg-muted/30">
            <span className="text-muted-foreground">{t('landing.ticker.p2pFee')}</span>
            <span className="font-num font-medium text-primary">{fallback?.p2pFeePercent ?? 0.3}%</span>
          </div>
          <div className="flex justify-between p-2 rounded-lg bg-muted/30">
            <span className="text-muted-foreground">{t('landing.ticker.directFee')}</span>
            <span className="font-num font-medium">{fallback?.platformFeePercent ?? 1.5}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatItem({ label, value, up, live }: { label: string; value: string; up?: boolean; live?: boolean }) {
  return (
    <div>
      <div className="text-muted-foreground text-[10px] uppercase tracking-wider flex items-center gap-1">
        {label}
        {live && <span className="w-1 h-1 rounded-full bg-success animate-pulse" />}
      </div>
      <div className={`font-num font-medium ${up === true ? 'text-success' : up === false ? 'text-rose-400' : ''}`}>
        {value}
      </div>
    </div>
  )
}

function PriceChangeIndicator({ change }: { change: number }) {
  const isUp = change >= 0
  return (
    <div className={`flex items-center gap-1 text-[10px] font-medium ${isUp ? 'text-success' : 'text-rose-400'}`}>
      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      <span className="font-num">{isUp ? '+' : ''}{change.toFixed(2)}%</span>
    </div>
  )
}

function Sparkline({ data, direction }: { data: number[]; direction: 'up' | 'down' | 'flat' }) {
  const [width, setWidth] = useState(280)
  const height = 40
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return [x, y]
  })
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ')
  const color = direction === 'up' ? 'oklch(0.72 0.19 155)' : direction === 'down' ? 'oklch(0.65 0.22 25)' : 'oklch(0.65 0.02 145)'

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="mt-2"
      ref={(el) => { if (el) setWidth(el.parentElement?.clientWidth || 280) }}
    >
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L${width},${height} L0,${height} Z`} fill="url(#spark-grad)" />
      <path d={path} stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  )
}

/**
 * Ticker bar — animated marquee of live stats (live market only, no fallbacks)
 */
export function TickerBar() {
  const { data, connectionState } = useTicker()
  const { t } = useLanguage()

  const hasData = !!data
  const dash = '—'
  const items = [
    { label: 'USDT/EGP', value: hasData ? fmtEgp(data.buyPriceEgp) : dash, change: hasData ? `${data.change24h >= 0 ? '+' : ''}${data.change24h.toFixed(2)}%` : '', up: (data?.change24h ?? 0) >= 0 },
    { label: '24H VOLUME', value: hasData ? `${fmtVol(data.volume24h)} EGP` : dash, change: '', up: true },
    { label: 'ACTIVE P2P', value: hasData ? fmtNum(data.activeOffers) : dash, change: '', up: true },
    { label: 'ONLINE', value: hasData ? fmtNum(data.onlineUsers) : dash, change: '', up: true },
    { label: 'HIGH 24H', value: hasData ? fmtEgp(data.high24h) : dash, change: '', up: true },
    { label: 'LOW 24H', value: hasData ? fmtEgp(data.low24h) : dash, change: '', up: false },
    { label: 'AVG TIME', value: '< 5 MIN', change: '', up: true },
    { label: 'SUCCESS RATE', value: '99.7%', change: '', up: true },
  ]

  return (
    <section className="border-y border-border/50 bg-card/30 py-2.5 sm:py-3 overflow-hidden relative">
      <div className="flex gap-6 sm:gap-12 animate-marquee whitespace-nowrap font-num text-xs sm:text-sm">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex gap-6 sm:gap-12">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-muted-foreground text-[9px] sm:text-[10px] uppercase tracking-wider">{item.label}</span>
                <span className="font-medium">{item.value}</span>
                {item.change && (
                  <span className={item.up ? 'text-success' : 'text-rose-400'}>{item.change}</span>
                )}
                <span className="text-muted-foreground/40 mx-1">·</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      {connectionState !== 'connected' && connectionState !== 'connecting' && (
        <div className="text-[10px] text-amber-400 text-center mt-1 opacity-70 flex items-center justify-center gap-1">
          <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
          {connectionState === 'reconnecting' ? `${t('landing.ticker.reconnectingMsg')}` : `${t('landing.ticker.offlineMsg')}`}
        </div>
      )}
    </section>
  )
}
