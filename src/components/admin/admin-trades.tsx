'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiCall, fmtEgp, fmtUsdt } from '@/lib/client'
import { Loader2, ArrowRightLeft, Search, Download, TrendingUp, TrendingDown } from 'lucide-react'

type AdminTrade = {
  id: string
  type: string
  usdtAmount: number
  egpAmount: number
  priceEgp: number
  feeEgp: number
  status: string
  createdAt: string
  user: { id: string; email: string; name: string | null; username: string }
}

export function AdminTrades() {
  const [trades, setTrades] = useState<AdminTrade[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await apiCall<{ trades: AdminTrade[] }>('/api/admin/trades?limit=200')
    setLoading(false)
    if (data) setTrades(data.trades)
  }

  useEffect(() => { load() }, [])

  const filtered = trades.filter((t) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return t.user.email.toLowerCase().includes(q) ||
           (t.user.name || '').toLowerCase().includes(q) ||
           t.user.username.toLowerCase().includes(q)
  })

  const totalVolume = trades.reduce((s, t) => s + t.egpAmount, 0)
  const totalUsdt = trades.reduce((s, t) => s + t.usdtAmount, 0)
  const totalFees = trades.reduce((s, t) => s + t.feeEgp, 0)

  function exportCSV() {
    const headers = ['Date', 'User', 'Email', 'Type', 'USDT', 'EGP', 'Price', 'Fee', 'Status']
    const rows = filtered.map((t) => [
      new Date(t.createdAt).toISOString(),
      t.user.name || t.user.username,
      t.user.email,
      t.type,
      t.usdtAmount.toString(),
      t.egpAmount.toString(),
      t.priceEgp.toString(),
      t.feeEgp.toString(),
      t.status,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `eg-money-trades-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-muted/30 p-2.5 text-center">
          <div className="font-num text-lg font-bold text-primary">{fmtEgp(totalVolume)}</div>
          <div className="text-[9px] text-muted-foreground">إجمالي الحجم (EGP)</div>
        </div>
        <div className="rounded-lg bg-muted/30 p-2.5 text-center">
          <div className="font-num text-lg font-bold text-emerald-500">{fmtUsdt(totalUsdt)}</div>
          <div className="text-[9px] text-muted-foreground">إجمالي USDT</div>
        </div>
        <div className="rounded-lg bg-muted/30 p-2.5 text-center">
          <div className="font-num text-lg font-bold text-amber-500">{fmtEgp(totalFees)}</div>
          <div className="text-[9px] text-muted-foreground">إجمالي الرسوم</div>
        </div>
      </div>

      {/* Search + export */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ابحث بالاسم أو البريد..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        {filtered.length > 0 && (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={exportCSV}>
            <Download className="w-3.5 h-3.5" /> CSV
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">لا توجد صفقات</CardContent></Card>
      ) : (
        filtered.slice(0, 50).map((t) => (
          <Card key={t.id}>
            <CardContent className="p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  t.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {t.type === 'BUY' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{t.type === 'BUY' ? 'شراء' : 'بيع'}</span>
                    <span className="font-num text-sm">{fmtUsdt(t.usdtAmount)} USDT</span>
                    <span className="text-[10px] text-muted-foreground">@ {fmtEgp(t.priceEgp)}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {t.user.name || t.user.username} · {t.user.email}
                  </div>
                </div>
              </div>
              <div className="text-left flex-shrink-0">
                <div className="font-num text-sm font-bold">{fmtEgp(t.egpAmount)} EGP</div>
                <div className="text-[9px] text-muted-foreground">{new Date(t.createdAt).toLocaleDateString('ar-EG')}</div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
