'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { useTicker } from '@/hooks/use-ticker'
import { useLanguage } from '@/hooks/use-language'
import {
  ArrowRightLeft, TrendingUp, Users, Clock, Target, Coins,
} from 'lucide-react'

/**
 * Animated number that:
 * 1. Counts up from 0 to the initial value when first rendered
 * 2. Smoothly transitions to new live values (from WebSocket)
 * 3. Flashes green when value goes up, red when it goes down
 *
 * Designed for stats that should "feel alive" — counters tick up
 * smoothly, never jump.
 */
function LiveNumber({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}: {
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}) {
  const [displayValue, setDisplayValue] = useState(value)
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)
  const prevValueRef = useRef(value)
  const animFrameRef = useRef<number | null>(null)
  const hasMountedRef = useRef(false)

  // On first mount: animate from 0 → initial value (count-up effect)
  useEffect(() => {
    const startTime = performance.now()
    const startVal = 0
    const endVal = value
    const duration = 1500

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(startVal + (endVal - startVal) * eased)
      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(endVal)
        hasMountedRef.current = true
      }
    }

    animFrameRef.current = requestAnimationFrame(animate)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run ONCE on mount

  // On subsequent value changes (live updates): smoothly transition + flash
  useEffect(() => {
    // Skip the very first call (handled by mount effect above)
    if (!hasMountedRef.current) return
    if (value === prevValueRef.current) return

    const prev = displayValue
    const next = value
    const direction: 'up' | 'down' = next >= prev ? 'up' : 'down'

    // Quick smooth transition (400ms)
    const startTime = performance.now()
    const duration = 400
    const startVal = prev

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 2)
      setDisplayValue(startVal + (next - startVal) * eased)
      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(next)
      }
    }
    animFrameRef.current = requestAnimationFrame(animate)

    // Flash effect — green for up, red for down
     
    setFlash(direction)
    const flashTimeout = setTimeout(() => setFlash(null), 800)

    prevValueRef.current = value
    return () => {
      clearTimeout(flashTimeout)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]) // Run when value changes

  const formatted = displayValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span
      className={`${className} transition-colors duration-500 ${
        flash === 'up' ? 'text-success' : flash === 'down' ? 'text-rose-400' : ''
      }`}
    >
      {prefix}{formatted}{suffix}
    </span>
  )
}

const STAT_CONFIG = [
  {
    icon: ArrowRightLeft,
    labelKey: 'liveStats.tradesToday',
    color: 'primary',
    getInitial: () => 1847,
    getLive: (d: any) => d?.tradesToday ?? null, // cumulative — only goes UP
    getTrend: () => '+12.3%',
    format: (v: number) => <LiveNumber value={v} />,
  },
  {
    icon: TrendingUp,
    labelKey: 'liveStats.volume24h',
    color: 'success',
    getInitial: () => 2_400_000,
    getLive: (d: any) => d?.volume24h ?? null, // cumulative — only goes UP
    getTrend: () => '+8.1%',
    format: (v: number) => <><LiveNumber value={v / 1_000_000} decimals={2} />M EGP</>,
  },
  {
    icon: Users,
    labelKey: 'liveStats.activeUsers',
    color: 'blue',
    getInitial: () => 312,
    getLive: (d: any) => d?.onlineUsers ?? null, // fluctuates up/down
    getTrend: (d: any) => {
      if (!d) return '+24'
      // Show a realistic trend based on whether online users went up or down
      return d.onlineUsers > 320 ? `+${d.onlineUsers - 300}` : d.onlineUsers < 290 ? `−${300 - d.onlineUsers}` : `+${d.onlineUsers - 300}`
    },
    format: (v: number) => <LiveNumber value={v} />,
  },
  {
    icon: Clock,
    labelKey: 'liveStats.avgTime',
    color: 'amber',
    getInitial: () => 4.8,
    getLive: () => null, // static
    getTrend: () => '−15%',
    format: (v: number) => <><LiveNumber value={v} decimals={1} />min</>,
  },
  {
    icon: Target,
    labelKey: 'liveStats.successRate',
    color: 'success',
    getInitial: () => 99.7,
    getLive: (d: any) => d?.successRate ?? null, // fluctuates slightly
    getTrend: () => '+0.3%',
    format: (v: number) => <><LiveNumber value={v} decimals={1} />%</>,
  },
  {
    icon: Coins,
    labelKey: 'liveStats.usdtTraded',
    color: 'primary',
    getInitial: () => 124580,
    getLive: (d: any) => d?.usdtTraded ?? null, // cumulative — only goes UP
    getTrend: () => '+2.4%',
    format: (v: number) => <><LiveNumber value={v} />+</>,
  },
] as const

const COLOR_MAP: Record<string, string> = {
  primary: 'text-primary bg-primary/10',
  success: 'text-success bg-success/10',
  blue: 'text-blue-400 bg-blue-500/10',
  amber: 'text-amber-400 bg-amber-500/10',
}

export function LiveStatsGrid() {
  const { data } = useTicker()
  const { t } = useLanguage()

  return (
    <div className="grid grid-cols-2 gap-3">
      {STAT_CONFIG.map((stat, i) => {
        const Icon = stat.icon
        const liveValue = stat.getLive(data)
        const value = liveValue ?? stat.getInitial()
        const trend = typeof stat.getTrend === 'function' ? (stat.getTrend as (d?: any) => string)(data) : (stat.getTrend as () => string)()
        const isLive = liveValue !== null

        return (
          <Card key={i} className="glass border-border/50 hover-lift">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${COLOR_MAP[stat.color]} flex items-center justify-center`}>
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="flex items-center gap-1">
                  {isLive && (
                    <span className="w-1 h-1 rounded-full bg-success animate-pulse" title="مباشر" />
                  )}
                  <span className={`text-[9px] sm:text-[10px] font-num font-medium ${
                    trend.startsWith('−') ? 'text-rose-400' : 'text-success'
                  }`}>
                    {trend}
                  </span>
                </div>
              </div>
              <div className="font-num text-xl sm:text-2xl font-bold">
                {stat.format(value)}
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{t(stat.labelKey)}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
