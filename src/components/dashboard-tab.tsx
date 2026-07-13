'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { fmtEgp, fmtUsdt, useAuth } from '@/lib/client'
import { Button } from '@/components/ui/button'
import { Wallet, TrendingUp, TrendingDown, ArrowDownToLine, ArrowUpFromLine, Activity, Download, ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { apiCall } from '@/lib/client'
import { LiveTicker } from '@/components/live-ticker'
import { useLanguage } from '@/hooks/use-language'
import { useTicker } from '@/hooks/use-ticker'
import { Counter } from '@/components/counter'
import { PriceAlerts } from '@/components/price-alerts'
import { ReferralCard } from '@/components/referral-card'
import { TradingChart } from '@/components/trading-chart'
import { P2pQuickTrade } from '@/components/p2p/quick-trade'

type Txn = {
  id: string
  type: string
  direction: string
  currency: string
  amount: number
  balanceAfter: number
  description: string
  createdAt: string
}

export function DashboardTab() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [txns, setTxns] = useState<Txn[]>([])
  const [totalTxnCount, setTotalTxnCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiCall<{ transactions: Txn[]; total?: number }>('/api/transactions?limit=10').then(({ data }) => {
      if (data) {
        setTxns(data.transactions)
        setTotalTxnCount(data.total || data.transactions.length)
      }
      setLoading(false)
    })
  }, [])

  const totalEgp = user?.egpBalance || 0
  const totalUsdt = user?.usdtBalance || 0
  // Use live ticker price for EGP→USDT conversion (no static fallback)
  const { data: ticker } = useTicker()
  const livePrice = ticker?.buyPriceEgp ?? 0
  const egpInUsdt = livePrice > 0 ? totalEgp / livePrice : 0

  // P&L: unrealized profit/loss on USDT holdings vs current price
  // For simplicity, we show the current value of USDT holdings in EGP
  const usdtValueEgp = livePrice > 0 ? totalUsdt * livePrice : 0
  const totalNetWorth = totalEgp + usdtValueEgp

  return (
    <div className="space-y-6">
      {/* Live Ticker + Balance cards */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Live Ticker - takes 1 column on lg */}
        <div className="lg:col-span-1">
          <LiveTicker fallback={{
            buyPriceEgp: 0,
            sellPriceEgp: 0,
            p2pFeePercent: 0.3,
            platformFeePercent: 1.5,
          }} />
        </div>

        {/* Balance cards - take 2 columns */}
        <div className="lg:col-span-2 grid gap-4 grid-cols-2">
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <Badge variant="secondary" className="bg-white/15 text-primary-foreground border-0">EGP</Badge>
              </div>
              <div className="text-sm opacity-80 mb-1">{t('dashboard.egpBalanceTitle')}</div>
              <div className="text-3xl font-bold tracking-tight font-num">{fmtEgp(totalEgp)}</div>
              <div className="text-xs opacity-70 mt-1">{t('dashboard.egpBalanceTitle')}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center font-bold text-sm">
                  ₮
                </div>
                <Badge variant="secondary" className="bg-white/15 text-white border-0">USDT</Badge>
              </div>
              <div className="text-sm opacity-80 mb-1">{t('dashboard.usdtBalanceTitle')}</div>
              <div className="text-3xl font-bold tracking-tight font-num">{fmtUsdt(totalUsdt)}</div>
              <div className="text-xs opacity-70 mt-1">{t('dashboard.usdtBalanceTitle')}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <Badge variant="outline" className="text-emerald-600">{t('dashboard.netWorthTitle')}</Badge>
              </div>
              <div className="text-sm text-muted-foreground mb-1">{t('dashboard.totalInUsd')}</div>
              <div className="text-3xl font-bold tracking-tight font-num">
                <Counter end={totalUsdt + egpInUsdt} decimals={2} />
              </div>
              <div className="text-xs text-muted-foreground mt-1">{t('dashboard.usdtEquivalent')}</div>
            </CardContent>
          </Card>

          {/* USDT value in EGP (live) */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <Badge variant="outline" className="text-amber-600">USDT → EGP</Badge>
              </div>
              <div className="text-sm text-muted-foreground mb-1">قيمة رصيد USDT بالجنيه</div>
              <div className="text-3xl font-bold tracking-tight font-num text-amber-600 dark:text-amber-400">
                {livePrice > 0 ? fmtEgp(usdtValueEgp) : '—'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {fmtUsdt(totalUsdt)} × {livePrice > 0 ? fmtEgp(livePrice) : '—'} EGP
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <Badge variant="outline">{t('dashboard.recentTransactions')}</Badge>
              </div>
              <div className="text-sm text-muted-foreground mb-1">{t('dashboard.transactionsCount')}</div>
              <div className="text-3xl font-bold tracking-tight font-num">
                <Counter end={totalTxnCount} />
              </div>
              <div className="text-xs text-muted-foreground mt-1">{t('dashboard.inLastPeriod')}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* P2P Quick Trade + Chart */}
      <div className="grid lg:grid-cols-2 gap-4">
        <TradingChart />
        <P2pQuickTrade />
      </div>

      {/* Price Alerts + Referral */}
      <div className="grid lg:grid-cols-2 gap-4">
        <PriceAlerts />
        <ReferralCard />
      </div>

      {/* Recent transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('dashboard.recentTransactions')}</CardTitle>
              <CardDescription>{t('dashboard.recentDesc')}</CardDescription>
            </div>
            {txns.length > 0 && (
              <div className="flex gap-2">
                <a href="/transactions">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    عرض الكل
                  </Button>
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    // Export all transactions as CSV
                    apiCall<{ transactions: Txn[] }>('/api/transactions?limit=10000').then(({ data }) => {
                      if (!data?.transactions) return
                      const headers = ['Date', 'Type', 'Direction', 'Currency', 'Amount', 'Balance After', 'Description']
                      const rows = data.transactions.map((tx) => [
                        new Date(tx.createdAt).toISOString(),
                        tx.type,
                        tx.direction,
                        tx.currency,
                        tx.amount.toString(),
                        tx.balanceAfter.toString(),
                        `"${tx.description.replace(/"/g, '""')}"`,
                      ])
                      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
                      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `eg-money-transactions-${new Date().toISOString().split('T')[0]}.csv`
                      a.click()
                      URL.revokeObjectURL(url)
                    })
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">{t('dashboard.loading')}</div>
          ) : txns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t('dashboard.noTransactions')}</p>
              <p className="text-xs mt-1">{t('dashboard.noTransactionsHint')}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {txns.map((t) => {
                const isCredit = t.direction === 'CREDIT'
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCredit
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownToLine className="w-5 h-5" />
                      ) : (
                        <ArrowUpFromLine className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{t.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(t.createdAt).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}{' '}
                        · {t.type}
                      </div>
                    </div>
                    <div className="text-left flex-shrink-0">
                      <div
                        className={`font-bold text-sm ${
                          isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isCredit ? '+' : '−'}
                        {t.currency === 'EGP' ? fmtEgp(t.amount) : fmtUsdt(t.amount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Balance: {t.currency === 'EGP' ? fmtEgp(t.balanceAfter) : fmtUsdt(t.balanceAfter)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
