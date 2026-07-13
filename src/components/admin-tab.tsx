'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  apiCall, fmtEgp, fmtUsdt, showSuccess, showError,
  PAYMENT_METHODS, methodLabel, methodIcon,
} from '@/lib/client'
import { PaymentMethodManager } from '@/components/admin/payment-method-manager'
import { BrandAssetManager } from '@/components/admin/brand-asset-manager'
import { GoogleOAuthManager } from '@/components/admin/google-oauth-manager'
import { PaymentWalletManager } from '@/components/admin/payment-wallet-manager'
import { AdminUserDetail } from '@/components/admin/user-detail'
import { VerificationQueue } from '@/components/admin/verification-queue'
import { AdminTrades } from '@/components/admin/admin-trades'
import { AdminP2P } from '@/components/admin/admin-p2p'
import { AdminOverview } from '@/components/admin/admin-overview'
import { useLanguage } from '@/hooks/use-language'
import { useTicker } from '@/hooks/use-ticker'
import { Loader2, Check, X, Users, Wallet, Settings as SettingsIcon, Clock, ShieldCheck, Zap, TrendingUp, Download, Search, Eye } from 'lucide-react'

type AdminDeposit = {
  id: string; amountEgp: number; method: string; reference: string | null;
  status: string; adminNote: string | null; createdAt: string; processedAt: string | null;
  senderNumber: string | null; receiptImage: string | null; assignedWalletId: string | null; currency: string;
  user: { id: string; email: string; name: string | null; phone: string | null }
}
type AdminWithdrawal = {
  id: string; amountEgp: number; method: string; destination: string;
  status: string; adminNote: string | null; createdAt: string; processedAt: string | null;
  user: { id: string; email: string; name: string | null; phone: string | null }
}
type AdminUser = {
  id: string; email: string; name: string | null; phone: string | null; role: string;
  egpBalance: number; usdtBalance: number; status: string; createdAt: string;
  stats: { deposits: number; withdrawals: number; trades: number; p2pBuyerTrades: number; p2pSellerTrades: number }
}

export function AdminTab() {
  const { t } = useLanguage()
  const { data: ticker } = useTicker()
  const [tab, setTab] = useState('overview')
  const [depStatusFilter, setDepStatusFilter] = useState('PENDING')
  const [wdStatusFilter, setWdStatusFilter] = useState('PENDING')
  const [userSearch, setUserSearch] = useState('')
  const [detailUserId, setDetailUserId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [deposits, setDeposits] = useState<AdminDeposit[]>([])
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Action dialogs
  const [actionTarget, setActionTarget] = useState<{ id: string; type: 'deposit' | 'withdrawal'; action: 'APPROVE' | 'REJECT' } | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Settings form
  const [settingsForm, setSettingsForm] = useState<any>({})

  async function loadDeposits() {
    setLoading(true)
    const { data } = await apiCall<{ deposits: AdminDeposit[] }>(
      `/api/admin/deposits?status=${depStatusFilter}`,
    )
    if (data) setDeposits(data.deposits)
    setLoading(false)
  }
  async function loadWithdrawals() {
    setLoading(true)
    const { data } = await apiCall<{ withdrawals: AdminWithdrawal[] }>(
      `/api/admin/withdrawals?status=${wdStatusFilter}`,
    )
    if (data) setWithdrawals(data.withdrawals)
    setLoading(false)
  }
  async function loadUsers() {
    setLoading(true)
    const { data } = await apiCall<{ users: AdminUser[] }>('/api/admin/users?limit=200')
    if (data) setUsers(data.users)
    setLoading(false)
  }
  async function loadSettings() {
    const { data } = await apiCall<{ settings: any }>('/api/admin/settings')
    if (data) {
      setSettings(data.settings)
      setSettingsForm(data.settings)
    }
  }

  useEffect(() => {
     
    if (tab === 'deposits') loadDeposits()
    else if (tab === 'withdrawals') loadWithdrawals()
    else if (tab === 'users') loadUsers()
    else if (tab === 'settings') loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, depStatusFilter, wdStatusFilter])

  // Load stats on mount (independent of active tab) so stat cards are always correct
  useEffect(() => {
    loadAdminStats()
    const interval = setInterval(loadAdminStats, 30000) // refresh every 30s
    return () => clearInterval(interval)
     
  }, [])

  // Load pending counts for stat cards
  const [pendingStats, setPendingStats] = useState({ deposits: 0, withdrawals: 0, users: 0 })
  async function loadAdminStats() {
    try {
      const [depRes, wdRes, userRes] = await Promise.all([
        apiCall('/api/admin/deposits?status=PENDING'),
        apiCall('/api/admin/withdrawals?status=PENDING'),
        apiCall('/api/admin/users?limit=1'),
      ])
      setPendingStats({
        deposits: depRes.data?.deposits?.length || 0,
        withdrawals: wdRes.data?.withdrawals?.length || 0,
        users: userRes.data?.users?.length || 0,
      })
    } catch {}
  }

  async function handleAction() {
    if (!actionTarget) return
    setSubmitting(true)
    const url = actionTarget.type === 'deposit' ? '/api/admin/deposits' : '/api/admin/withdrawals'
    const { data, error } = await apiCall(url, {
      method: 'PATCH',
      body: JSON.stringify({
        [actionTarget.type === 'deposit' ? 'depositId' : 'withdrawalId']: actionTarget.id,
        action: actionTarget.action,
        adminNote,
      }),
    })
    setSubmitting(false)
    if (error) {
      showError(error)
      return
    }
    showSuccess(data?.message || t('common.success'))
    setActionTarget(null)
    setAdminNote('')
    if (actionTarget.type === 'deposit') loadDeposits()
    else loadWithdrawals()
  }

  async function toggleUserStatus(userId: string, currentStatus: string) {
    const action = currentStatus === 'ACTIVE' ? 'SUSPEND' : 'ACTIVATE'
    const { data, error } = await apiCall('/api/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({ userId, action }),
    })
    if (error) {
      showError(error)
      return
    }
    showSuccess(data?.message)
    loadUsers()
  }

  async function saveSettings() {
    setSubmitting(true)
    const { data, error } = await apiCall('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(settingsForm),
    })
    setSubmitting(false)
    if (error) {
      showError(error)
      return
    }
    showSuccess(data?.message || t('common.success'))
    loadSettings()
  }

  // Stats — use pendingStats (always loaded) for counts, local data for EGP/USDT totals
  const pendingDepCount = pendingStats.deposits
  const pendingWdCount = pendingStats.withdrawals
  const totalUsers = pendingStats.users
  const totalEgpHeld = users.length > 0 ? users.reduce((s, u) => s + u.egpBalance, 0) : 0
  const totalUsdtHeld = users.length > 0 ? users.reduce((s, u) => s + u.usdtBalance, 0) : 0

  // CSV export for deposits/withdrawals
  function exportCSV(type: 'deposits' | 'withdrawals', data: any[]) {
    const headers = type === 'deposits'
      ? ['Date', 'User', 'Email', 'Amount EGP', 'Method', 'Reference', 'Status', 'Processed At', 'Admin Note']
      : ['Date', 'User', 'Email', 'Amount EGP', 'Method', 'Destination', 'Status', 'Processed At', 'Admin Note']
    const rows = data.map((d) => [
      new Date(d.createdAt).toISOString(),
      d.user?.name || '—',
      d.user?.email || '—',
      d.amountEgp.toString(),
      d.method,
      type === 'deposits' ? (d.reference || '—') : (d.destination || '—'),
      d.status,
      d.processedAt ? new Date(d.processedAt).toISOString() : '—',
      `"${(d.adminNote || '').replace(/"/g, '""')}"`,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `eg-money-${type}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          {t('admin.title')}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t('admin.desc')}
        </p>
      </div>

      {/* Live market price banner */}
      {ticker && ticker.buyPriceEgp > 0 && (
        <div className="flex items-center gap-4 p-3 rounded-xl glass border-border/50">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-aurora-2 flex items-center justify-center font-bold text-primary-foreground text-sm">₮</div>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">USDT / EGP — سعر السوق المباشر</div>
            <div className="flex items-baseline gap-3">
              <span className="font-num text-xl font-bold text-primary">{new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(ticker.buyPriceEgp)}</span>
              <span className={`text-xs font-num ${ticker.change24h >= 0 ? 'text-success' : 'text-rose-400'}`}>
                {ticker.change24h >= 0 ? '▲' : '▼'} {Math.abs(ticker.change24h).toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
            <div>
              <div className="font-num font-medium text-foreground">{new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(ticker.high24h)}</div>
              <div>أعلى 24h</div>
            </div>
            <div>
              <div className="font-num font-medium text-foreground">{new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(ticker.low24h)}</div>
              <div>أدنى 24h</div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <Badge variant="outline" className="text-amber-600">{t('admin.pending')}</Badge>
            </div>
            <div className="text-2xl font-bold">{pendingDepCount}</div>
            <div className="text-xs text-muted-foreground">إيداعات بانتظار المراجعة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <Badge variant="outline" className="text-amber-600">{t('admin.pending')}</Badge>
            </div>
            <div className="text-2xl font-bold">{pendingWdCount}</div>
            <div className="text-xs text-muted-foreground">سحوبات بانتظار المراجعة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <Badge variant="outline" className="text-blue-600">{t('admin.users')}</Badge>
            </div>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <div className="text-xs text-muted-foreground">إجمالي المسجلين</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              <Badge variant="outline" className="text-emerald-600">{t('admin.liquidity')}</Badge>
            </div>
            <div className="text-2xl font-bold">{fmtEgp(totalEgpHeld)}</div>
            <div className="text-xs text-muted-foreground">جنيه محتجز + {fmtUsdt(totalUsdtHeld)} USDT</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full max-w-4xl grid-cols-8">
          <TabsTrigger value="overview">نظرة</TabsTrigger>
          <TabsTrigger value="deposits">{t('admin.deposits')}</TabsTrigger>
          <TabsTrigger value="withdrawals">{t('admin.withdrawals')}</TabsTrigger>
          <TabsTrigger value="trades">صفقات</TabsTrigger>
          <TabsTrigger value="p2p">P2P</TabsTrigger>
          <TabsTrigger value="users">{t('admin.users')}</TabsTrigger>
          <TabsTrigger value="verifications">تحقق</TabsTrigger>
          <TabsTrigger value="settings">{t('admin.settings')}</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <AdminOverview />
        </TabsContent>

        {/* Deposits */}
        <TabsContent value="deposits" className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-2 flex-1">
              {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={depStatusFilter === s ? 'default' : 'outline'}
                  onClick={() => setDepStatusFilter(s)}
                >
                  {s === 'PENDING' ? t('admin.pending') : s === 'APPROVED' ? t('admin.completed') : s === 'REJECTED' ? t('admin.rejected') : t('admin.all')}
                </Button>
              ))}
            </div>
            {deposits.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => exportCSV('deposits', deposits)}
              >
                <Download className="w-3.5 h-3.5" />
                CSV
              </Button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : deposits.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">{t('admin.noRequests')}</CardContent></Card>
          ) : (
            deposits.map((d) => (
              <Card key={d.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-lg">{fmtEgp(d.amountEgp)} جنيه</span>
                        <Badge variant="outline">{methodIcon(d.method)} {methodLabel(d.method)}</Badge>
                        <AdminStatusBadge status={d.status} />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        From: {d.user.name || 'Unknown'} · {d.user.email}
                        {d.user.phone && ` · ${d.user.phone}`}
                      </div>
                      {d.reference && (
                        <div className="text-sm font-mono mt-1">مرجع: {d.reference}</div>
                      )}
                      {/* New fields: sender number + receipt image */}
                      {d.senderNumber && (
                        <div className="text-sm mt-1 flex items-center gap-1">
                          <span className="text-muted-foreground">رقم المرسل:</span>
                          <span className="font-num font-medium" dir="ltr">{d.senderNumber}</span>
                        </div>
                      )}
                      {d.receiptImage && (
                        <a
                          href={d.receiptImage}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                        >
                          <Eye className="w-3 h-3" />
                          عرض إيصال الدفع
                        </a>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(d.createdAt).toLocaleString('en-US')}
                      </div>
                      {d.adminNote && (
                        <div className="text-xs text-amber-600 mt-1">ملاحظة: {d.adminNote}</div>
                      )}
                    </div>
                    {(d.status === 'PENDING' || d.status === 'PENDING_PAYMENT') && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => {
                            setActionTarget({ id: d.id, type: 'deposit', action: 'APPROVE' })
                            setAdminNote('')
                          }}
                        >
                          <Check className="w-4 h-4" />
                          اعتماد
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-rose-600 border-rose-200 hover:bg-rose-50"
                          onClick={() => {
                            setActionTarget({ id: d.id, type: 'deposit', action: 'REJECT' })
                            setAdminNote('')
                          }}
                        >
                          <X className="w-4 h-4" />
                          رفض
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Withdrawals */}
        <TabsContent value="withdrawals" className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-2 flex-1">
              {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={wdStatusFilter === s ? 'default' : 'outline'}
                  onClick={() => setWdStatusFilter(s)}
                >
                  {s === 'PENDING' ? t('admin.pending') : s === 'APPROVED' ? t('admin.completed') : s === 'REJECTED' ? t('admin.rejected') : t('admin.all')}
                </Button>
              ))}
            </div>
            {withdrawals.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => exportCSV('withdrawals', withdrawals)}
              >
                <Download className="w-3.5 h-3.5" />
                CSV
              </Button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : withdrawals.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">{t('admin.noRequests')}</CardContent></Card>
          ) : (
            withdrawals.map((w) => (
              <Card key={w.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-lg">{fmtEgp(w.amountEgp)} جنيه</span>
                        <Badge variant="outline">{methodIcon(w.method)} {methodLabel(w.method)}</Badge>
                        <AdminStatusBadge status={w.status} />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        إلى: {w.user.name || 'Unknown'} · {w.user.email}
                        {w.user.phone && ` · ${w.user.phone}`}
                      </div>
                      <div className="text-sm font-mono mt-1">وجهة التحويل: {w.destination}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(w.createdAt).toLocaleString('en-US')}
                      </div>
                      {w.adminNote && (
                        <div className="text-xs text-amber-600 mt-1">ملاحظة: {w.adminNote}</div>
                      )}
                    </div>
                    {w.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => {
                            setActionTarget({ id: w.id, type: 'withdrawal', action: 'APPROVE' })
                            setAdminNote('')
                          }}
                        >
                          <Check className="w-4 h-4" />
                          تم التحويل
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-rose-600 border-rose-200 hover:bg-rose-50"
                          onClick={() => {
                            setActionTarget({ id: w.id, type: 'withdrawal', action: 'REJECT' })
                            setAdminNote('')
                          }}
                        >
                          <X className="w-4 h-4" />
                          رفض
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Users */}
        <TabsContent value="users" className="space-y-3">
          {/* User search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالاسم أو البريد أو الهاتف..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
          {loading ? (
            <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : users.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">{t('admin.noUsers')}</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="text-right p-3">المستخدم</th>
                        <th className="text-right p-3">الهاتف</th>
                        <th className="text-right p-3">رصيد EGP</th>
                        <th className="text-right p-3">رصيد USDT</th>
                        <th className="text-right p-3">النشاط</th>
                        <th className="text-right p-3">الحالة</th>
                        <th className="text-right p-3">إجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users
                        .filter((u) => {
                          if (!userSearch.trim()) return true
                          const q = userSearch.toLowerCase()
                          return (
                            u.name?.toLowerCase().includes(q) ||
                            u.email.toLowerCase().includes(q) ||
                            u.phone?.toLowerCase().includes(q)
                          )
                        })
                        .map((u) => (
                        <tr key={u.id} className="border-t">
                          <td className="p-3">
                            <div className="font-medium">{u.name || 'Unknown'}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                            {u.role === 'ADMIN' && (
                              <Badge variant="default" className="mt-1">{t('admin.adminRole')}</Badge>
                            )}
                          </td>
                          <td className="p-3 text-xs">{u.phone || '—'}</td>
                          <td className="p-3 font-mono">{fmtEgp(u.egpBalance)}</td>
                          <td className="p-3 font-mono">{fmtUsdt(u.usdtBalance)}</td>
                          <td className="p-3 text-xs text-muted-foreground">
                            <div>{t('admin.deposits')}: {u.stats.deposits}</div>
                            <div>{t('admin.withdrawals')}: {u.stats.withdrawals}</div>
                            <div>P2P: {u.stats.p2pBuyerTrades + u.stats.p2pSellerTrades}</div>
                          </td>
                          <td className="p-3">
                            <Badge variant={u.status === 'ACTIVE' ? 'default' : 'destructive'}>
                              {u.status === 'ACTIVE' ? t('admin.active') : t('admin.suspended')}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => { setDetailUserId(u.id); setDetailOpen(true) }}
                                title="عرض التفاصيل"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              {u.role !== 'ADMIN' && (
                                <Button
                                  size="sm"
                                  variant={u.status === 'ACTIVE' ? 'outline' : 'default'}
                                  onClick={() => toggleUserStatus(u.id, u.status)}
                                >
                                  {u.status === 'ACTIVE' ? t('admin.suspend') : t('admin.activate')}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Trades */}
        <TabsContent value="trades" className="space-y-3">
          <AdminTrades />
        </TabsContent>

        {/* P2P */}
        <TabsContent value="p2p" className="space-y-3">
          <AdminP2P />
        </TabsContent>

        {/* Verifications */}
        <TabsContent value="verifications" className="space-y-3">
          <VerificationQueue />
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                {t('admin.settings')}
              </CardTitle>
              <CardDescription>{t('admin.desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Live price info banner */}
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-sm">{t('admin.livePriceInfo')}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t('admin.livePriceDesc')}</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-sm text-muted-foreground">{t('admin.limitSettings')}</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>{t('admin.minTrade')}</Label>
                    <Input
                      type="number"
                      value={settingsForm.minTradeEgp ?? ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, minTradeEgp: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('admin.maxTrade')}</Label>
                    <Input
                      type="number"
                      value={settingsForm.maxTradeEgp ?? ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, maxTradeEgp: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('admin.minP2p')}</Label>
                    <Input
                      type="number"
                      value={settingsForm.minP2pEgp ?? ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, minP2pEgp: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('admin.maxP2p')}</Label>
                    <Input
                      type="number"
                      value={settingsForm.maxP2pEgp ?? ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, maxP2pEgp: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-sm text-muted-foreground">الرسوم</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('admin.platformFee')}</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={settingsForm.platformFeePercent ?? ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, platformFeePercent: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('admin.p2pFee')}</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={settingsForm.p2pFeePercent ?? ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, p2pFeePercent: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              {/* Verification & Security settings */}
              <div>
                <h3 className="font-semibold mb-3 text-sm text-muted-foreground">التحقق والأمان</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <div className="text-sm font-medium">إلزام تأكيد البريد الإلكتروني</div>
                      <div className="text-[10px] text-muted-foreground">منع المستخدمين من التداول قبل تأكيد البريد</div>
                    </div>
                    <Switch
                      checked={settingsForm.requireEmailVerification ?? true}
                      onCheckedChange={(v) => setSettingsForm({ ...settingsForm, requireEmailVerification: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <div className="text-sm font-medium">إلزام تأكيد الهاتف</div>
                      <div className="text-[10px] text-muted-foreground">منع المستخدمين من التداول قبل تأكيد الهاتف</div>
                    </div>
                    <Switch
                      checked={settingsForm.requirePhoneVerification ?? true}
                      onCheckedChange={(v) => setSettingsForm({ ...settingsForm, requirePhoneVerification: v })}
                    />
                  </div>
                </div>
              </div>

              {/* Deposit limits */}
              <div>
                <h3 className="font-semibold mb-3 text-sm text-muted-foreground">حدود الإيداع (لكل محفظة)</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الحد اليومي (EGP)</Label>
                    <Input
                      type="number"
                      value={settingsForm.depositDailyLimitEgp ?? 60000}
                      onChange={(e) => setSettingsForm({ ...settingsForm, depositDailyLimitEgp: Number(e.target.value) })}
                    />
                    <p className="text-[10px] text-muted-foreground">افتراضي: 60,000 جنيه</p>
                  </div>
                  <div className="space-y-2">
                    <Label>الحد الشهري (EGP)</Label>
                    <Input
                      type="number"
                      value={settingsForm.depositMonthlyLimitEgp ?? 200000}
                      onChange={(e) => setSettingsForm({ ...settingsForm, depositMonthlyLimitEgp: Number(e.target.value) })}
                    />
                    <p className="text-[10px] text-muted-foreground">افتراضي: 200,000 جنيه</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveSettings} disabled={submitting} size="lg">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  حفظ {t('admin.settings')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods Manager */}
          <PaymentMethodManager />

          {/* Brand Assets Manager */}
          <BrandAssetManager />

          {/* Payment Wallet Manager (smart deposit wallets) */}
          <PaymentWalletManager />

          {/* Google OAuth Manager */}
          <GoogleOAuthManager />
        </TabsContent>
      </Tabs>

      {/* User detail dialog */}
      <AdminUserDetail
        userId={detailUserId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* Action confirm dialog */}
      <Dialog open={!!actionTarget} onOpenChange={(o) => !o && setActionTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionTarget?.action === 'APPROVE' ? t('admin.confirmApprove') : t('admin.confirmReject')}
            </DialogTitle>
            <DialogDescription>
              {actionTarget?.action === 'APPROVE'
                ? actionTarget.type === 'deposit'
                  ? t('admin.approve')
                  : t('admin.transferred')
                : actionTarget?.type === 'deposit'
                  ? t('admin.reject')
                  : t('admin.reject')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{t('admin.adminNote')}</Label>
            <Textarea
              placeholder={t('admin.adminNotePlaceholder')}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionTarget(null)}>{t('common.cancel')}</Button>
            <Button
              className={actionTarget?.action === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}
              onClick={handleAction}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {actionTarget?.action === 'APPROVE' ? t('admin.approve') : t('admin.reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AdminStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: any }> = {
    PENDING: { label: 'PENDING', variant: 'secondary' },
    PENDING_PAYMENT: { label: 'PENDING_PAYMENT', variant: 'secondary' },
    APPROVED: { label: 'APPROVED', variant: 'default' },
    REJECTED: { label: 'REJECTED', variant: 'destructive' },
  }
  const { label, variant } = map[status] || { label: status, variant: 'outline' }
  return <Badge variant={variant}>{label}</Badge>
}
