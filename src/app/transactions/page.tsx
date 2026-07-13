'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BrandLogo } from '@/components/brand-logo'
import { useAuth, apiCall, fmtEgp, fmtUsdt } from '@/lib/client'
import { useLanguage } from '@/hooks/use-language'
import {
  ArrowRight, ArrowLeft, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft,
  Users, Download, Search, Loader2, Filter, TrendingUp, TrendingDown,
  Wallet, X, ChevronLeft,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

type Transaction = {
  id: string
  type: string // DEPOSIT | WITHDRAWAL | TRADE | P2P_TRADE | FEE
  direction: string // CREDIT | DEBIT
  currency: string // EGP | USDT
  amount: number
  balanceAfter: number
  description: string
  referenceId: string | null
  referenceType: string | null
  createdAt: string
}

type Stats = {
  egp: { credits: number; debits: number; net: number }
  usdt: { credits: number; debits: number; net: number }
}

type Filters = {
  type: string | null
  direction: string | null
  currency: string | null
  search: string
  startDate: string
  endDate: string
}

const DEFAULT_FILTERS: Filters = {
  type: null,
  direction: null,
  currency: null,
  search: '',
  startDate: '',
  endDate: '',
}

const TYPE_OPTIONS = [
  { value: 'DEPOSIT', label: 'إيداع', icon: ArrowDownToLine, color: 'text-emerald-500' },
  { value: 'WITHDRAWAL', label: 'سحب', icon: ArrowUpFromLine, color: 'text-rose-500' },
  { value: 'TRADE', label: 'تداول مباشر', icon: ArrowRightLeft, color: 'text-blue-500' },
  { value: 'P2P_TRADE', label: 'صفقة P2P', icon: Users, color: 'text-violet-500' },
  { value: 'FEE', label: 'رسوم', icon: Wallet, color: 'text-amber-500' },
]

export default function TransactionsPage() {
  const router = useRouter()
  const { user, initialized, fetchUser } = useAuth()
  const { t } = useLanguage()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasNext, setHasNext] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [showFilters, setShowFilters] = useState(false)

  const buildQuery = useCallback((cursor?: string) => {
    const params = new URLSearchParams()
    params.set('limit', '50')
    if (cursor) params.set('cursor', cursor)
    if (filters.type) params.set('type', filters.type)
    if (filters.direction) params.set('direction', filters.direction)
    if (filters.currency) params.set('currency', filters.currency)
    if (filters.search) params.set('search', filters.search)
    if (filters.startDate) params.set('startDate', new Date(filters.startDate).toISOString())
    if (filters.endDate) params.set('endDate', new Date(filters.endDate + 'T23:59:59').toISOString())
    return params.toString()
  }, [filters])

  const loadInitial = useCallback(async () => {
    setLoading(true)
    const { data } = await apiCall<{ transactions: Transaction[]; stats: Stats; total: number; pagination: any }>(
      `/api/transactions?${buildQuery()}`,
    )
    if (data) {
      setTransactions(data.transactions)
      setStats(data.stats)
      setTotal(data.total)
      setHasNext(data.pagination.hasNext)
      setNextCursor(data.pagination.nextCursor)
    }
    setLoading(false)
  }, [buildQuery])

  useEffect(() => {
    if (!initialized) {
      fetchUser()
      return
    }
    if (!user) {
      router.push('/')
      return
    }
    loadInitial()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, user])

  // Reload on filter change
  useEffect(() => {
    if (!initialized || !user) return
    const timeout = setTimeout(() => {
      loadInitial()
    }, 300) // debounce
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  async function loadMore() {
    if (!hasNext || !nextCursor) return
    setLoadingMore(true)
    const { data } = await apiCall<{ transactions: Transaction[]; pagination: any }>(
      `/api/transactions?${buildQuery(nextCursor)}`,
    )
    if (data) {
      setTransactions((prev) => [...prev, ...data.transactions])
      setHasNext(data.pagination.hasNext)
      setNextCursor(data.pagination.nextCursor)
    }
    setLoadingMore(false)
  }

  function exportCSV() {
    if (transactions.length === 0) return
    const headers = ['التاريخ', 'النوع', 'الاتجاه', 'العملة', 'المبلغ', 'الرصيد بعد', 'الوصف', 'المرجع']
    const typeLabels: Record<string, string> = {
      DEPOSIT: 'إيداع',
      WITHDRAWAL: 'سحب',
      TRADE: 'تداول مباشر',
      P2P_TRADE: 'صفقة P2P',
      FEE: 'رسوم',
    }
    const rows = transactions.map((t) => [
      new Date(t.createdAt).toLocaleString('en-GB'),
      typeLabels[t.type] || t.type,
      t.direction === 'CREDIT' ? 'دائن' : 'مدين',
      t.currency,
      t.amount,
      t.balanceAfter,
      t.description,
      t.referenceId || '',
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `eg-money-transactions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const isAr = true // this page is Arabic-first
  const BackIcon = isAr ? ArrowRight : ArrowLeft

  const hasActiveFilters =
    filters.type !== null ||
    filters.direction !== null ||
    filters.currency !== null ||
    filters.search !== '' ||
    filters.startDate !== '' ||
    filters.endDate !== ''

  if (!initialized || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container-fluid">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => router.push('/')}
            >
              <BackIcon className="w-4 h-4" />
              {isAr ? 'رجوع' : 'Back'}
            </Button>
            <BrandLogo size="sm" />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={exportCSV}
              disabled={transactions.length === 0}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container-fluid py-6 space-y-6 max-w-5xl mx-auto">
        {/* Page title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Wallet className="w-7 h-7 text-primary" />
            سجل المعاملات
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            عرض كامل لجميع معاملاتك ({total} معاملة)
          </p>
        </div>

        {/* Stats summary */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">إجمالي حركة EGP</div>
                <div className="text-xl font-bold font-num">
                  {fmtEgp(stats.egp.net)} <span className="text-xs font-normal">EGP</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[10px]">
                  <span className="text-emerald-500 inline-flex items-center gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5" />
                    دائن: {fmtEgp(stats.egp.credits)}
                  </span>
                  <span className="text-rose-500 inline-flex items-center gap-0.5">
                    <TrendingDown className="w-2.5 h-2.5" />
                    مدين: {fmtEgp(stats.egp.debits)}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">إجمالي حركة USDT</div>
                <div className="text-xl font-bold font-num">
                  {fmtUsdt(stats.usdt.net)} <span className="text-xs font-normal">USDT</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[10px]">
                  <span className="text-emerald-500 inline-flex items-center gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5" />
                    دائن: {fmtUsdt(stats.usdt.credits)}
                  </span>
                  <span className="text-rose-500 inline-flex items-center gap-0.5">
                    <TrendingDown className="w-2.5 h-2.5" />
                    مدين: {fmtUsdt(stats.usdt.debits)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search + filter toggle */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث في الوصف..."
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                className="pr-9"
              />
              {filters.search && (
                <button
                  onClick={() => setFilters((f) => ({ ...f, search: '' }))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <Button
              variant={showFilters || hasActiveFilters ? 'default' : 'outline'}
              size="sm"
              className="gap-1.5"
              onClick={() => setShowFilters((s) => !s)}
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">فلترة</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">
                  {[filters.type, filters.direction, filters.currency, filters.startDate, filters.endDate].filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Advanced filters */}
          {showFilters && (
            <Card>
              <CardContent className="p-3 space-y-3">
                {/* Type chips */}
                <div>
                  <div className="text-xs text-muted-foreground mb-1.5">النوع</div>
                  <div className="flex flex-wrap gap-1.5">
                    {TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFilters((f) => ({ ...f, type: f.type === opt.value ? null : opt.value }))}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border transition-colors ${
                          filters.type === opt.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <opt.icon className={`w-3 h-3 ${opt.color}`} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Direction */}
                <div>
                  <div className="text-xs text-muted-foreground mb-1.5">الاتجاه</div>
                  <div className="flex gap-1.5">
                    {[
                      { value: 'CREDIT', label: 'دائن (وارد)', color: 'text-emerald-500' },
                      { value: 'DEBIT', label: 'مدين (صادر)', color: 'text-rose-500' },
                    ].map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setFilters((f) => ({ ...f, direction: f.direction === d.value ? null : d.value }))}
                        className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                          filters.direction === d.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Currency */}
                <div>
                  <div className="text-xs text-muted-foreground mb-1.5">العملة</div>
                  <div className="flex gap-1.5">
                    {['EGP', 'USDT'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setFilters((f) => ({ ...f, currency: f.currency === c ? null : c }))}
                        className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                          filters.currency === c
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Date range */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">من تاريخ</div>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">إلى تاريخ</div>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
                      className="text-xs"
                    />
                  </div>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                  >
                    <X className="w-3 h-3 ml-1" />
                    مسح كل الفلاتر
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Transactions list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : transactions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد معاملات{hasActiveFilters ? ' تطابق الفلاتر' : ''}</p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                >
                  مسح الفلاتر
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const typeOption = TYPE_OPTIONS.find((o) => o.value === tx.type)
              const TypeIcon = typeOption?.icon || Wallet
              const isCredit = tx.direction === 'CREDIT'
              return (
                <Card key={tx.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCredit
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                      }`}
                    >
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{typeOption?.label || tx.type}</span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] ${isCredit ? 'text-emerald-600 border-emerald-300' : 'text-rose-600 border-rose-300'}`}
                        >
                          {isCredit ? 'دائن' : 'مدين'}
                        </Badge>
                        <Badge variant="outline" className="text-[9px]">
                          {tx.currency}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">
                        {tx.description}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(tx.createdAt).toLocaleString('en-GB', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      <div
                        className={`font-bold font-num text-sm ${
                          isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isCredit ? '+' : '−'}
                        {tx.currency === 'USDT' ? fmtUsdt(tx.amount) : fmtEgp(tx.amount)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        الرصيد: {tx.currency === 'USDT' ? fmtUsdt(tx.balanceAfter) : fmtEgp(tx.balanceAfter)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {/* Load more */}
            {hasNext && (
              <div className="flex justify-center pt-3">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="gap-2"
                >
                  {loadingMore ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ChevronLeft className="w-4 h-4" />
                  )}
                  تحميل المزيد
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
