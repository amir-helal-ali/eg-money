'use client'

import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { apiCall, fmtEgp, fmtUsdt } from '@/lib/client'
import {
  Mail, Phone, Shield, CheckCircle2, XCircle, Clock, Wallet,
  Coins, TrendingUp, TrendingDown, Users, Gift, Lock, Unlock,
  ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, Activity,
  AlertCircle,
} from 'lucide-react'

type UserDetail = {
  user: {
    id: string
    email: string
    username: string
    name: string | null
    phone: string | null
    countryCode: string | null
    role: string
    egpBalance: number
    usdtBalance: number
    status: string
    emailVerified: boolean
    phoneVerified: boolean
    googleId: string | null
    googleEmail: string | null
    googleName: string | null
    googleAvatar: string | null
    referralCode: string
    lastLoginAt: string | null
    createdAt: string
  }
  stats: {
    deposits: number
    withdrawals: number
    trades: number
    p2pOffers: number
    p2pBuyerTrades: number
    p2pSellerTrades: number
    transactions: number
    notifications: number
    priceAlerts: number
    referrals: number
  }
  referrer: { id: string; name: string | null; email: string; username: string } | null
  recentTransactions: any[]
  recentDeposits: any[]
  recentWithdrawals: any[]
  recentTrades: any[]
}

export function AdminUserDetail({ userId, open, onOpenChange }: {
  userId: string | null
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const [data, setData] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId || !open) return
    setLoading(true)
    apiCall<UserDetail>(`/api/admin/users/${userId}`).then(({ data, error }) => {
      setLoading(false)
      if (data) setData(data)
    })
  }, [userId, open])

  async function handleAction(action: string) {
    if (!userId) return
    const { data, error } = await apiCall(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    })
    if (error) return
    // Refresh
    apiCall<UserDetail>(`/api/admin/users/${userId}`).then(({ data }) => {
      if (data) setData(data)
    })
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden glass-strong border-border/50">
        {/* Visually hidden title for accessibility (always rendered) */}
        <DialogHeader className="sr-only">
          <DialogTitle>تفاصيل المستخدم</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6 space-y-4">
            {loading || !data ? (
              <div className="text-center py-12 text-muted-foreground">جارٍ التحميل...</div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center font-bold text-primary-foreground">
                    {(data.user.name || data.user.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-lg">{data.user.name || data.user.username}</div>
                    <div className="text-xs text-muted-foreground font-normal">@{data.user.username}</div>
                  </div>
                </div>

                {/* Status + Verification badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant={data.user.status === 'ACTIVE' ? 'default' : 'destructive'}>
                    {data.user.status === 'ACTIVE' ? '✓ نشط' : '✗ موقوف'}
                  </Badge>
                  {data.user.role === 'ADMIN' && (
                    <Badge variant="outline" className="text-primary">أدمن</Badge>
                  )}
                  <Badge variant="outline" className={data.user.emailVerified ? 'text-emerald-500' : 'text-rose-400'}>
                    <Mail className="w-2.5 h-2.5 ml-1" />
                    {data.user.emailVerified ? 'بريد مؤكد' : 'بريد غير مؤكد'}
                  </Badge>
                  <Badge variant="outline" className={data.user.phoneVerified ? 'text-emerald-500' : 'text-rose-400'}>
                    <Phone className="w-2.5 h-2.5 ml-1" />
                    {data.user.phoneVerified ? 'هاتف مؤكد' : 'هاتف غير مؤكد'}
                  </Badge>
                  {data.user.googleId && (
                    <Badge variant="outline" className="text-blue-400">
                      <Shield className="w-2.5 h-2.5 ml-1" />
                      Google
                    </Badge>
                  )}
                </div>

                {/* Balance cards */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="bg-gradient-to-br from-primary/80 to-primary/60 text-primary-foreground border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Wallet className="w-4 h-4 opacity-80" />
                        <span className="text-[10px] opacity-80 uppercase">EGP</span>
                      </div>
                      <div className="text-xl font-bold font-num">{fmtEgp(data.user.egpBalance)}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-emerald-600/80 to-emerald-700/60 text-white border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Coins className="w-4 h-4 opacity-80" />
                        <span className="text-[10px] opacity-80 uppercase">USDT</span>
                      </div>
                      <div className="text-xl font-bold font-num">{fmtUsdt(data.user.usdtBalance)}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Contact info */}
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">البريد:</span>
                      <span className="font-medium">{data.user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">الهاتف:</span>
                      <span className="font-medium font-num" dir="ltr">{data.user.phone || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Gift className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">كود الإحالة:</span>
                      <span className="font-num font-medium text-primary">{data.user.referralCode}</span>
                    </div>
                    {data.referrer && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">دعاه:</span>
                        <span className="font-medium">{data.referrer.name || data.referrer.username}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">آخر دخول:</span>
                      <span className="font-medium">
                        {data.user.lastLoginAt
                          ? new Date(data.user.lastLoginAt).toLocaleString('ar-EG')
                          : 'لم يسجل بعد'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">تاريخ التسجيل:</span>
                      <span className="font-medium">
                        {new Date(data.user.createdAt).toLocaleString('ar-EG')}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity stats */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[
                    { label: 'إيداعات', value: data.stats.deposits, icon: ArrowDownToLine, color: 'text-success' },
                    { label: 'سحوبات', value: data.stats.withdrawals, icon: ArrowUpFromLine, color: 'text-rose-400' },
                    { label: 'صفقات', value: data.stats.trades, icon: ArrowRightLeft, color: 'text-blue-400' },
                    { label: 'P2P', value: data.stats.p2pBuyerTrades + data.stats.p2pSellerTrades, icon: Users, color: 'text-purple-400' },
                    { label: 'إحالات', value: data.stats.referrals, icon: Gift, color: 'text-amber-400' },
                  ].map((s, i) => {
                    const Icon = s.icon
                    return (
                      <div key={i} className="rounded-lg bg-muted/30 p-2.5 text-center">
                        <Icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
                        <div className="font-num font-bold text-sm">{s.value}</div>
                        <div className="text-[9px] text-muted-foreground">{s.label}</div>
                      </div>
                    )
                  })}
                </div>

                {/* Admin actions */}
                <div className="flex flex-wrap gap-2">
                  {data.user.status === 'ACTIVE' ? (
                    <Button size="sm" variant="outline" className="gap-1.5 text-rose-400" onClick={() => handleAction('SUSPEND')}>
                      <Lock className="w-3.5 h-3.5" /> إيقاف
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="gap-1.5 text-emerald-500" onClick={() => handleAction('ACTIVATE')}>
                      <Unlock className="w-3.5 h-3.5" /> تفعيل
                    </Button>
                  )}
                  {!data.user.emailVerified && (
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleAction('VERIFY_EMAIL')}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> تأكيد البريد
                    </Button>
                  )}
                  {!data.user.phoneVerified && data.user.phone && (
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleAction('VERIFY_PHONE')}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> تأكيد الهاتف
                    </Button>
                  )}
                  {data.user.emailVerified && data.user.role !== 'ADMIN' && (
                    <Button size="sm" variant="ghost" className="gap-1.5 text-amber-400" onClick={() => handleAction('UNVERIFY_EMAIL')}>
                      <XCircle className="w-3.5 h-3.5" /> إلغاء تأكيد البريد
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Recent transactions */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">آخر المعاملات</h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {data.recentTransactions.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">لا توجد معاملات</p>
                    ) : (
                      data.recentTransactions.slice(0, 10).map((t) => (
                        <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 text-xs">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                            t.direction === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {t.direction === 'CREDIT' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{t.description}</div>
                            <div className="text-[9px] text-muted-foreground">{new Date(t.createdAt).toLocaleString('ar-EG')}</div>
                          </div>
                          <div className={`font-num font-medium ${t.direction === 'CREDIT' ? 'text-emerald-500' : 'text-rose-400'}`}>
                            {t.direction === 'CREDIT' ? '+' : '−'}{t.currency === 'EGP' ? fmtEgp(t.amount) : fmtUsdt(t.amount)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent deposits */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">آخر الإيداعات</h4>
                  <div className="space-y-1.5">
                    {data.recentDeposits.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">لا توجد إيداعات</p>
                    ) : (
                      data.recentDeposits.slice(0, 5).map((d) => (
                        <div key={d.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 text-xs">
                          <div>
                            <div className="font-medium">{fmtEgp(d.amountEgp)} EGP — {d.method}</div>
                            <div className="text-[9px] text-muted-foreground">{new Date(d.createdAt).toLocaleString('ar-EG')}</div>
                          </div>
                          <Badge variant="outline" className={
                            d.status === 'APPROVED' ? 'text-emerald-500' :
                            d.status === 'REJECTED' ? 'text-rose-400' :
                            d.status === 'PENDING_PAYMENT' ? 'text-amber-400' : 'text-muted-foreground'
                          }>
                            {d.status === 'APPROVED' ? 'معتمد' :
                             d.status === 'REJECTED' ? 'مرفوض' :
                             d.status === 'PENDING_PAYMENT' ? 'بانتظار الدفع' : 'بانتظار المراجعة'}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent trades */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">آخر الصفقات</h4>
                  <div className="space-y-1.5">
                    {data.recentTrades.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">لا توجد صفقات</p>
                    ) : (
                      data.recentTrades.slice(0, 5).map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 text-xs">
                          <div>
                            <div className="font-medium">
                              {t.type === 'BUY' ? 'شراء' : 'بيع'} {fmtUsdt(t.usdtAmount)} USDT @ {fmtEgp(t.priceEgp)}
                            </div>
                            <div className="text-[9px] text-muted-foreground">{new Date(t.createdAt).toLocaleString('ar-EG')}</div>
                          </div>
                          <div className="font-num font-medium">{fmtEgp(t.egpAmount)} EGP</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
