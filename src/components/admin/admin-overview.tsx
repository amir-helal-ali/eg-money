'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiCall, fmtEgp, fmtUsdt } from '@/lib/client'
import { useTicker } from '@/hooks/use-ticker'
import {
  Users, UserCheck, UserX, Shield, Clock, ArrowDownToLine, ArrowUpFromLine,
  TrendingUp, ArrowRightLeft, Wallet, Coins, DollarSign, AlertCircle,
  CheckCircle2, XCircle, Activity, Gift,
} from 'lucide-react'

type Overview = {
  users: { total: number; active: number; suspended: number; admins: number; unverifiedEmail: number; unverifiedPhone: number }
  deposits: { pending: number; approved: number; totalAmountEgp: number; todayAmountEgp: number }
  withdrawals: { pending: number; approved: number; totalAmountEgp: number; todayAmountEgp: number }
  trades: { total: number; today: number; thisMonth: number; totalFeesEgp: number; todayFeesEgp: number }
  p2p: { totalTrades: number; pendingTrades: number; completedTrades: number; activeOffers: number }
  balances: { totalEgpHeld: number; totalUsdtHeld: number }
  transactions: { total: number }
}

export function AdminOverview() {
  const { data: ticker } = useTicker()
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiCall<Overview>('/api/admin/overview').then(({ data }) => {
      if (data) setData(data)
      setLoading(false)
    })
    const interval = setInterval(() => {
      apiCall<Overview>('/api/admin/overview').then(({ data }) => {
        if (data) setData(data)
      })
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading || !data) {
    return <div className="text-center py-8 text-muted-foreground">جارٍ التحميل...</div>
  }

  const livePrice = ticker?.buyPriceEgp ?? 0
  const totalValueEgp = data.balances.totalEgpHeld + (data.balances.totalUsdtHeld * livePrice)

  return (
    <div className="space-y-4">
      {/* Live price banner */}
      {livePrice > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl glass border-border/50">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-aurora-2 flex items-center justify-center font-bold text-primary-foreground text-sm">₮</div>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">USDT/EGP — السعر المباشر</div>
            <div className="flex items-baseline gap-2">
              <span className="font-num text-xl font-bold text-primary">{fmtEgp(livePrice)}</span>
              {ticker && (
                <span className={`text-xs font-num ${ticker.change24h >= 0 ? 'text-success' : 'text-rose-400'}`}>
                  {ticker.change24h >= 0 ? '▲' : '▼'} {Math.abs(ticker.change24h).toFixed(2)}%
                </span>
              )}
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
            <div><div className="font-num font-medium text-foreground">{ticker ? fmtEgp(ticker.high24h) : '—'}</div><div>أعلى 24h</div></div>
            <div><div className="font-num font-medium text-foreground">{ticker ? fmtEgp(ticker.low24h) : '—'}</div><div>أدنى 24h</div></div>
          </div>
        </div>
      )}

      {/* Top KPI row — platform health */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={Clock}
          label="إيداعات معلّقة"
          value={String(data.deposits.pending)}
          sub={`${fmtEgp(data.deposits.todayAmountEgp)} EGP اليوم`}
          color="text-amber-500"
          urgent={data.deposits.pending > 0}
        />
        <KpiCard
          icon={Clock}
          label="سحوبات معلّقة"
          value={String(data.withdrawals.pending)}
          sub={`${fmtEgp(data.withdrawals.todayAmountEgp)} EGP اليوم`}
          color="text-amber-500"
          urgent={data.withdrawals.pending > 0}
        />
        <KpiCard
          icon={TrendingUp}
          label="صفقات اليوم"
          value={String(data.trades.today)}
          sub={`${fmtEgp(data.trades.todayFeesEgp)} EGP رسوم`}
          color="text-emerald-500"
        />
        <KpiCard
          icon={ArrowRightLeft}
          label="P2P نشط"
          value={String(data.p2p.pendingTrades)}
          sub={`${data.p2p.activeOffers} عرض نشط`}
          color="text-blue-400"
          urgent={data.p2p.pendingTrades > 0}
        />
      </div>

      {/* Balances row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={Wallet}
          label="إجمالي EGP محتجز"
          value={fmtEgp(data.balances.totalEgpHeld)}
          sub={`${data.users.active} مستخدم نشط`}
          color="text-primary"
        />
        <KpiCard
          icon={Coins}
          label="إجمالي USDT محتجز"
          value={fmtUsdt(data.balances.totalUsdtHeld)}
          sub={`≈ ${livePrice > 0 ? fmtEgp(data.balances.totalUsdtHeld * livePrice) : '—'} EGP`}
          color="text-emerald-500"
        />
        <KpiCard
          icon={DollarSign}
          label="إجمالي قيمة المنصة"
          value={fmtEgp(totalValueEgp)}
          sub="EGP + USDT"
          color="text-amber-500"
        />
        <KpiCard
          icon={Activity}
          label="إجمالي المعاملات"
          value={String(data.transactions.total)}
          sub={`${data.trades.total} صفقة تداول`}
          color="text-purple-400"
        />
      </div>

      {/* Users row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={Users}
          label="إجمالي المستخدمين"
          value={String(data.users.total)}
          sub={`${data.users.admins} أدمن`}
          color="text-primary"
        />
        <KpiCard
          icon={UserCheck}
          label="نشطون"
          value={String(data.users.active)}
          color="text-emerald-500"
        />
        <KpiCard
          icon={AlertCircle}
          label="بريد غير مؤكد"
          value={String(data.users.unverifiedEmail)}
          color="text-amber-500"
          urgent={data.users.unverifiedEmail > 0}
        />
        <KpiCard
          icon={AlertCircle}
          label="هاتف غير مؤكد"
          value={String(data.users.unverifiedPhone)}
          color="text-amber-500"
          urgent={data.users.unverifiedPhone > 0}
        />
      </div>

      {/* Financial summary */}
      <Card className="glass border-border/50">
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            الملخص المالي
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div className="flex justify-between p-2 rounded-lg bg-muted/20">
              <span className="text-muted-foreground">إيداعات (إجمالي)</span>
              <span className="font-num font-bold text-emerald-500">{fmtEgp(data.deposits.totalAmountEgp)}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-muted/20">
              <span className="text-muted-foreground">سحوبات (إجمالي)</span>
              <span className="font-num font-bold text-rose-400">{fmtEgp(data.withdrawals.totalAmountEgp)}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-muted/20">
              <span className="text-muted-foreground">رسوم التداول</span>
              <span className="font-num font-bold text-amber-500">{fmtEgp(data.trades.totalFeesEgp)}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-muted/20">
              <span className="text-muted-foreground">صافي التدفق</span>
              <span className="font-num font-bold text-primary">
                {fmtEgp(data.deposits.totalAmountEgp - data.withdrawals.totalAmountEgp)}
              </span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-muted/20">
              <span className="text-muted-foreground">صفقات هذا الشهر</span>
              <span className="font-num font-bold">{data.trades.thisMonth}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-muted/20">
              <span className="text-muted-foreground">P2P مكتملة</span>
              <span className="font-num font-bold text-blue-400">{data.p2p.completedTrades}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function KpiCard({
  icon: Icon, label, value, sub, color, urgent,
}: {
  icon: any; label: string; value: string; sub?: string; color: string; urgent?: boolean
}) {
  return (
    <Card className={`glass border-border/50 ${urgent ? 'ring-1 ring-amber-500/30' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`w-9 h-9 rounded-lg bg-muted/30 flex items-center justify-center ${color}`}>
            <Icon className="w-4 h-4" />
          </div>
          {urgent && (
            <Badge variant="outline" className="text-[8px] h-4 px-1 bg-amber-500/10 text-amber-500 border-amber-500/30">
              يحتاج إجراء
            </Badge>
          )}
        </div>
        <div className={`font-num text-xl font-bold ${color}`}>{value}</div>
        <div className="text-[10px] text-muted-foreground">{label}</div>
        {sub && <div className="text-[9px] text-muted-foreground/70 mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  )
}
