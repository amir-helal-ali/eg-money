'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useLanguage } from '@/hooks/use-language'
import { useTicker } from '@/hooks/use-ticker'
import { BarChart3, TrendingUp } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { fmtEgp } from '@/lib/client'

export function TradingChart() {
  const { lang, t } = useLanguage()
  const { data: tickerData } = useTicker()
  const [chartData, setChartData] = useState<{ time: string; price: number }[]>([])

  // Build chart data from ticker history
  useEffect(() => {
    if (tickerData?.history && tickerData.history.length > 1) {
      const data = tickerData.history.map((h) => ({
        time: new Date(h.t).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        price: h.p,
      }))
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChartData(data)
    }
  }, [tickerData?.history, lang])

  const currentPrice = tickerData?.buyPriceEgp || 0
  const change24h = tickerData?.change24h || 0
  const isUp = change24h >= 0

  return (
    <Card className="glass border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              {lang === 'ar' ? 'حركة السعر' : 'Price Movement'}
            </CardTitle>
            <CardDescription className="text-[10px]">
              {lang === 'ar' ? 'USDT / EGP — مباشر' : 'USDT / EGP — live'}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="font-num text-lg font-bold text-primary">
              {fmtEgp(currentPrice)}
            </div>
            <div className={`text-xs font-num font-medium flex items-center gap-1 justify-end ${isUp ? 'text-success' : 'text-rose-400'}`}>
              <TrendingUp className={`w-3 h-3 ${!isUp ? 'rotate-180' : ''}`} />
              {isUp ? '+' : ''}{change24h.toFixed(2)}%
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isUp ? '#22c55e' : '#f43f5e'} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={isUp ? '#22c55e' : '#f43f5e'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }}
                interval="preserveStartEnd"
                minTickGap={30}
              />
              <YAxis
                domain={['dataMin - 0.1', 'dataMax + 0.1']}
                tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }}
                tickFormatter={(v) => Number(v).toFixed(1)}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(20, 20, 30, 0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                formatter={(value: any) => [`${fmtEgp(Number(value))} EGP`, lang === 'ar' ? 'السعر' : 'Price']}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={isUp ? '#22c55e' : '#f43f5e'}
                strokeWidth={2}
                fill="url(#priceGradient)"
                animationDuration={300}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-muted-foreground text-xs">
            {lang === 'ar' ? 'جارٍ تحميل البيانات...' : 'Loading data...'}
          </div>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/30">
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground">
              {lang === 'ar' ? 'أعلى 24h' : 'High 24h'}
            </div>
            <div className="font-num text-sm font-bold text-success">
              {fmtEgp(tickerData?.high24h || 0)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground">
              {lang === 'ar' ? 'أدنى 24h' : 'Low 24h'}
            </div>
            <div className="font-num text-sm font-bold text-rose-400">
              {fmtEgp(tickerData?.low24h || 0)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground">
              {lang === 'ar' ? 'السبريد' : 'Spread'}
            </div>
            <div className="font-num text-sm font-bold text-primary">
              {fmtEgp(tickerData?.spread || 0)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
