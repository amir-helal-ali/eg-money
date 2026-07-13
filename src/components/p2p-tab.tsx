'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import {
  apiCall, fmtEgp, fmtUsdt, useAuth, showSuccess, showError,
  PAYMENT_METHODS, methodLabel, methodIcon,
} from '@/lib/client'
import { useTicker } from '@/hooks/use-ticker'
import { useLanguage } from '@/hooks/use-language'
import {
  Loader2, Users, Plus, ArrowRightLeft, ShieldCheck, Clock,
  CheckCircle2, XCircle, Phone, Zap, MessageSquare, Star, AlertTriangle,
  ImageIcon, UserCircle, Download,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { OfferFilters, DEFAULT_FILTERS, type P2pFilters } from '@/components/p2p/offer-filters'
import { TradeChat } from '@/components/p2p/trade-chat'
import { ReviewForm, ReputationDisplay } from '@/components/p2p/review-form'
import { MyOffers } from '@/components/p2p/my-offers'
import { UserProfileDialog } from '@/components/p2p/user-profile'
import { PaymentCountdown } from '@/components/p2p/payment-countdown'
import { TradeProgress } from '@/components/p2p/trade-progress'
import { TemplatePicker } from '@/components/p2p/template-picker'
import { useP2pEvents } from '@/hooks/use-p2p-events'

type Offer = {
  id: string
  type: 'BUY' | 'SELL'
  usdtAmount: number
  priceEgp: number
  minOrderEgp: number
  maxOrderEgp: number
  paymentMethods: string[]
  status: string
  createdAt: string
  user: {
    id: string
    name: string
    username: string
    memberSince: string
    tradesCount: number
    ratingAvg: number
    ratingCount: number
    verified: boolean
    online: boolean
  }
}

type P2pTrade = {
  id: string
  usdtAmount: number
  egpAmount: number
  priceEgp: number
  feeEgp: number
  paymentMethod: string
  paymentReference: string | null
  status: string
  createdAt: string
  paidAt: string | null
  releasedAt: string | null
  cancelledAt: string | null
  myRole: 'BUYER' | 'SELLER'
  counterparty: { id: string; name: string; phone: string | null }
  offer: { id: string; type: string; paymentMethods: string[] }
  dispute?: {
    id: string
    reason: string
    description: string
    status: string
    resolution: string | null
    openedById: string
    createdAt: string
    resolvedAt: string | null
  } | null
  myReview?: { id: string; rating: number; comment: string | null } | null
}

export function P2PTab() {
  const { user, fetchUser } = useAuth()
  const { t } = useLanguage()
  const { data: ticker } = useTicker()
  const [tab, setTab] = useState('market')
  const [offers, setOffers] = useState<Offer[]>([])
  const [myTrades, setMyTrades] = useState<P2pTrade[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<P2pFilters>(DEFAULT_FILTERS)

  // Create-offer dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [offerType, setOfferType] = useState<'BUY' | 'SELL'>('BUY')
  const [offerUsdt, setOfferUsdt] = useState('')
  const [offerPrice, setOfferPrice] = useState('')
  const [offerMin, setOfferMin] = useState('100')
  const [offerMax, setOfferMax] = useState('')
  const [offerMethods, setOfferMethods] = useState<string[]>(['VODAFONE_CASH'])
  const [creating, setCreating] = useState(false)

  // Take-offer dialog
  const [takeOffer, setTakeOffer] = useState<Offer | null>(null)
  const [takeUsdt, setTakeUsdt] = useState('')
  const [takeEgp, setTakeEgp] = useState('')
  const [takeMethod, setTakeMethod] = useState('VODAFONE_CASH')
  const [taking, setTaking] = useState(false)

  // Cancel trade dialog
  const [cancelTradeId, setCancelTradeId] = useState<string | null>(null)

  // Trade detail / chat dialog
  const [chatTrade, setChatTrade] = useState<P2pTrade | null>(null)

  // User profile dialog state
  const [profileUser, setProfileUser] = useState<{ id: string; name: string } | null>(null)

  // Receipt upload (for buyer when marking trade as paid)
  const [receiptImage, setReceiptImage] = useState<string | null>(null)
  const [markingPaidTradeId, setMarkingPaidTradeId] = useState<string | null>(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)

  function handleFileUpload(file: File) {
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      showError('حجم الصورة يجب ألا يتجاوز 2 ميجابايت')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      setReceiptImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function handleMarkPaid(tradeId: string) {
    setMarkingPaidTradeId(tradeId)
    setUploadingReceipt(true)
    const { data, error } = await apiCall('/api/p2p/trades', {
      method: 'PATCH',
      body: JSON.stringify({
        tradeId,
        action: 'MARK_PAID',
        receiptImage, // may be null — backend handles it
      }),
    })
    setUploadingReceipt(false)
    setMarkingPaidTradeId(null)
    if (error) {
      showError(error)
      return
    }
    showSuccess(data?.message || 'تم تأكيد الدفع')
    setReceiptImage(null)
    await fetchUser()
    loadMyTrades()
  }

  async function loadOffers() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.type !== 'ALL') params.set('type', filters.type)
    if (filters.paymentMethod) params.set('paymentMethod', filters.paymentMethod)
    if (filters.minPrice) params.set('minPrice', filters.minPrice)
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
    if (filters.minAmount) params.set('minAmount', filters.minAmount)
    if (filters.maxAmount) params.set('maxAmount', filters.maxAmount)
    if (filters.search) params.set('q', filters.search)
    if (filters.sort) params.set('sort', filters.sort)
    const { data } = await apiCall<{ offers: Offer[] }>(`/api/p2p/offers?${params.toString()}`)
    if (data) setOffers(data.offers)
    setLoading(false)
  }

  async function loadMyTrades() {
    const { data } = await apiCall<{ trades: P2pTrade[] }>('/api/p2p/trades')
    if (data) setMyTrades(data.trades)
  }

  useEffect(() => {
     
    if (tab === 'market') loadOffers()
    else if (tab === 'myTrades') loadMyTrades()
    const interval = setInterval(() => {
      if (tab === 'market') loadOffers()
      else if (tab === 'myTrades') loadMyTrades()
    }, 15000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, filters])

  // Real-time P2P events: instantly refresh trades + balances when something
  // happens to one of our trades. This means no waiting for the 15s poll.
  useP2pEvents('TRADE_PAID', () => {
    loadMyTrades()
  })
  useP2pEvents('TRADE_RELEASED', () => {
    loadMyTrades()
    fetchUser() // balances changed
  })
  useP2pEvents('TRADE_CANCELLED', () => {
    loadMyTrades()
    fetchUser()
  })
  useP2pEvents('DISPUTE_OPENED', () => {
    loadMyTrades()
  })
  useP2pEvents('DISPUTE_RESOLVED', () => {
    loadMyTrades()
    fetchUser()
  })
  useP2pEvents('OFFER_TAKEN', () => {
    // Someone took one of our offers — refresh everything
    if (tab === 'market') loadOffers()
    if (tab === 'myOffers') {
      // The MyOffers component manages its own state; trigger a soft refresh
      // by toggling a key (handled by parent if needed)
    }
  })

  async function handleCreateOffer() {
    if (!offerUsdt || !offerPrice) {
      showError(t('p2p.amount'))
      return
    }
    if (offerMethods.length === 0) {
      showError(t('p2p.paymentMethods'))
      return
    }
    setCreating(true)
    const { data, error } = await apiCall('/api/p2p/offers', {
      method: 'POST',
      body: JSON.stringify({
        type: offerType,
        usdtAmount: Number(offerUsdt),
        priceEgp: Number(offerPrice),
        minOrderEgp: Number(offerMin) || 100,
        maxOrderEgp: Number(offerMax) || 100000,
        paymentMethods: offerMethods,
      }),
    })
    setCreating(false)
    if (error) {
      showError(error)
      return
    }
    showSuccess(data?.message || t('common.success'))
    setCreateOpen(false)
    setOfferUsdt('')
    setOfferPrice('')
    setOfferMax('')
    await fetchUser()
    loadOffers()
  }

  async function handleCancelOffer(offerId: string) {
    const { data, error } = await apiCall(`/api/p2p/offers?id=${offerId}`, { method: 'DELETE' })
    if (error) {
      showError(error)
      return
    }
    showSuccess(data?.message || t('common.success'))
    await fetchUser()
    loadOffers()
  }

  async function handleTakeOffer() {
    if (!takeOffer) return
    if (!takeUsdt && !takeEgp) {
      showError(t('p2p.amount'))
      return
    }
    setTaking(true)
    const { data, error } = await apiCall('/api/p2p/trades', {
      method: 'POST',
      body: JSON.stringify({
        offerId: takeOffer.id,
        usdtAmount: takeUsdt ? Number(takeUsdt) : undefined,
        egpAmount: takeEgp ? Number(takeEgp) : undefined,
        paymentMethod: takeMethod,
      }),
    })
    setTaking(false)
    if (error) {
      showError(error)
      return
    }
    showSuccess(data?.message || t('common.success'))
    setTakeOffer(null)
    setTakeUsdt('')
    setTakeEgp('')
    await fetchUser()
    setTab('myTrades')
    loadMyTrades()
  }

  async function handleTradeAction(tradeId: string, action: 'MARK_PAID' | 'RELEASE' | 'CANCEL', paymentReference?: string) {
    const { data, error } = await apiCall('/api/p2p/trades', {
      method: 'PATCH',
      body: JSON.stringify({ tradeId, action, paymentReference }),
    })
    if (error) {
      showError(error)
      return
    }
    showSuccess(data?.message || t('common.success'))
    await fetchUser()
    loadMyTrades()
  }

  async function confirmCancel() {
    if (!cancelTradeId) return
    await handleTradeAction(cancelTradeId, 'CANCEL')
    setCancelTradeId(null)
  }

  const toggleMethod = (m: string) => {
    setOfferMethods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))
  }

  /** Export my P2P trades as a CSV file (UTF-8 with BOM for Excel). */
  function exportTradesCSV(trades: P2pTrade[]) {
    if (!trades || trades.length === 0) return
    const headers = [
      'ID', 'التاريخ', 'الدور', 'النوع', 'الحالة', 'USDT', 'EGP', 'السعر',
      'الرسوم', 'طريقة الدفع', 'الطرف الآخر', 'هاتف الطرف الآخر', 'مرجع الدفع',
      'تم الدفع', 'تم الإفراج', 'تم الإلغاء', 'النزاع',
    ]
    const statusLabels: Record<string, string> = {
      PENDING_PAYMENT: 'بانتظار الدفع',
      PAID: 'تم الدفع',
      RELEASED: 'مكتملة',
      DISPUTED: 'نزاع',
      CANCELLED: 'ملغاة',
    }
    const rows = trades.map((t) => [
      t.id,
      new Date(t.createdAt).toLocaleString('en-GB'),
      t.myRole === 'BUYER' ? 'مشتري' : 'بائع',
      t.offer.type === 'SELL' ? 'شراء USDT' : 'بيع USDT',
      statusLabels[t.status] || t.status,
      t.usdtAmount,
      t.egpAmount,
      t.priceEgp,
      t.feeEgp,
      methodLabel(t.paymentMethod),
      t.counterparty.name,
      t.counterparty.phone || '',
      t.paymentReference || '',
      t.paidAt ? new Date(t.paidAt).toLocaleString('en-GB') : '',
      t.releasedAt ? new Date(t.releasedAt).toLocaleString('en-GB') : '',
      t.cancelledAt ? new Date(t.cancelledAt).toLocaleString('en-GB') : '',
      t.dispute ? `${t.dispute.status} (${t.dispute.reason})` : '',
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `eg-money-p2p-trades-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Live market price comparison for offer cards
  const tickerBuy = ticker?.buyPriceEgp || 0
  const tickerSell = ticker?.sellPriceEgp || 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            {t('p2p.title')}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t('p2p.desc')}
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="w-4 h-4" />
              {t('p2p.createAd')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('p2p.createAd')} جديد</DialogTitle>
              <DialogDescription>{t('p2p.createAd')}</DialogDescription>
            </DialogHeader>

            <Tabs value={offerType} onValueChange={(v) => setOfferType(v as 'BUY' | 'SELL')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="BUY">{t('p2p.wantBuy')}</TabsTrigger>
                <TabsTrigger value="SELL">{t('p2p.wantSell')}</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Templates: save current form / pick a saved template */}
            <TemplatePicker
              currentForm={{
                type: offerType,
                usdtAmount: offerUsdt,
                priceEgp: offerPrice,
                minOrderEgp: offerMin,
                maxOrderEgp: offerMax,
                paymentMethods: offerMethods,
              }}
              onSelect={(tpl) => {
                setOfferType(tpl.type)
                setOfferUsdt(tpl.usdtAmount)
                setOfferPrice(tpl.priceEgp)
                setOfferMin(tpl.minOrderEgp)
                setOfferMax(tpl.maxOrderEgp)
                setOfferMethods(tpl.paymentMethods)
              }}
            />

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>{t('p2p.amount')}</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={offerUsdt}
                  onChange={(e) => setOfferUsdt(e.target.value)}
                />
                {offerType === 'SELL' && (
                  <p className="text-xs text-muted-foreground">
                    {t('trade.balanceTitle')}: {fmtUsdt(user?.usdtBalance || 0)} USDT
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t('p2p.price')}</Label>
                  {ticker && ticker.buyPriceEgp > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const livePrice = offerType === 'BUY'
                          ? ticker.buyPriceEgp
                          : ticker.sellPriceEgp
                        setOfferPrice(livePrice.toFixed(2))
                      }}
                      className="text-[10px] text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <Zap className="w-2.5 h-2.5" />
                      {t('p2p.useMarketPrice')}: {fmtEgp(offerType === 'BUY' ? ticker.buyPriceEgp : ticker.sellPriceEgp)}
                    </button>
                  )}
                </div>
                <Input
                  type="number"
                  placeholder={ticker ? ticker.buyPriceEgp.toFixed(2) : '0.00'}
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="font-num"
                />
                {/* Price preset buttons */}
                {ticker && ticker.buyPriceEgp > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {[
                      { label: 'سوق', pct: 0 },
                      { label: '+1%', pct: 1 },
                      { label: '+2%', pct: 2 },
                      { label: '+3%', pct: 3 },
                      { label: '-1%', pct: -1 },
                      { label: '-2%', pct: -2 },
                    ].map((p) => {
                      const base = offerType === 'BUY' ? ticker.buyPriceEgp : ticker.sellPriceEgp
                      const target = base * (1 + p.pct / 100)
                      return (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => setOfferPrice(target.toFixed(2))}
                          className={`px-1.5 py-0.5 text-[10px] rounded border transition-colors ${
                            p.pct === 0
                              ? 'border-primary/50 text-primary hover:bg-primary/10'
                              : p.pct > 0
                              ? 'border-amber-300/50 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950'
                              : 'border-emerald-300/50 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                          }`}
                        >
                          {p.label}
                        </button>
                      )
                    })}
                  </div>
                )}
                {ticker && ticker.buyPriceEgp > 0 && offerPrice && (
                  <p className="text-[10px] text-muted-foreground">
                    {(() => {
                      const diff = Number(offerPrice) - (offerType === 'BUY' ? ticker.buyPriceEgp : ticker.sellPriceEgp)
                      const pct = ((diff / (offerType === 'BUY' ? ticker.buyPriceEgp : ticker.sellPriceEgp)) * 100).toFixed(1)
                      const isAbove = diff >= 0
                      return (
                        <span className={isAbove ? 'text-amber-500' : 'text-emerald-500'}>
                          {isAbove ? '▲' : '▼'} {Math.abs(Number(pct))}% {isAbove ? 'فوق' : 'تحت'} سعر السوق
                        </span>
                      )
                    })()}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t('p2p.minOrder')}</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={offerMin}
                    onChange={(e) => setOfferMin(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('p2p.maxOrder')}</Label>
                  <Input
                    type="number"
                    placeholder="100000"
                    value={offerMax}
                    onChange={(e) => setOfferMax(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('p2p.paymentMethods')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <label
                      key={m.value}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                        offerMethods.includes(m.value)
                          ? 'bg-primary/10 border-primary'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={offerMethods.includes(m.value)}
                        onCheckedChange={() => toggleMethod(m.value)}
                      />
                      <span className="text-sm">
                        {m.icon} {m.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleCreateOffer} disabled={creating}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                نشر الإعلان
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full max-w-xl grid-cols-3">
          <TabsTrigger value="market">{t('p2p.market')}</TabsTrigger>
          <TabsTrigger value="myOffers">إعلاناتي</TabsTrigger>
          <TabsTrigger value="myTrades">
            {t('p2p.myTrades')}
            {myTrades.filter((x) => x.status === 'PENDING_PAYMENT' || x.status === 'PAID').length > 0 && (
              <Badge variant="secondary" className="mr-1 text-[10px] h-4 px-1">
                {myTrades.filter((x) => x.status === 'PENDING_PAYMENT' || x.status === 'PAID').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Market */}
        <TabsContent value="market" className="space-y-3">
          <OfferFilters
            filters={filters}
            onChange={setFilters}
            tickerPrice={tickerBuy > 0 ? Math.round(tickerBuy * 100) / 100 : undefined}
          />

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : offers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{t('p2p.noAds')}</p>
                <p className="text-xs mt-1">كن أول من ينشر إعلاناً</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {offers.map((o) => {
                const marketPrice = o.type === 'SELL' ? tickerBuy : tickerSell
                const diffPct = marketPrice > 0 ? ((o.priceEgp - marketPrice) / marketPrice) * 100 : 0
                return (
                  <Card key={o.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              o.type === 'SELL'
                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                                : 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                            }`}
                          >
                            {o.type === 'SELL' ? <ArrowRightLeft className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant={o.type === 'SELL' ? 'default' : 'secondary'}>
                                {o.type === 'SELL' ? t('p2p.seller') : t('p2p.buyer')}
                              </Badge>
                              <button
                                onClick={() => setProfileUser({ id: o.user.id, name: o.user.name })}
                                className="text-sm text-muted-foreground hover:text-primary hover:underline inline-flex items-center gap-1"
                              >
                                {o.user.name}
                                <UserCircle className="w-3 h-3 opacity-50" />
                              </button>
                              {/* Online indicator */}
                              {o.user.online ? (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                  متصل
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                  <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                                  غير متصل
                                </span>
                              )}
                              {o.user.verified && (
                                <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                                  <ShieldCheck className="w-3 h-3 ml-0.5" />
                                  موثّق
                                </Badge>
                              )}
                            </div>
                            {/* Reputation row */}
                            <div className="mt-1">
                              <ReputationDisplay
                                ratingAvg={o.user.ratingAvg}
                                ratingCount={o.user.ratingCount}
                                tradesCount={o.user.tradesCount}
                                size="xs"
                              />
                            </div>
                            <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                              <span className="text-2xl font-bold">{fmtEgp(o.priceEgp)}</span>
                              <span className="text-xs text-muted-foreground">EGP/USDT</span>
                              <span className="text-sm text-muted-foreground">
                                · {fmtUsdt(o.usdtAmount)} USDT
                              </span>
                              {marketPrice > 0 && Math.abs(diffPct) >= 0.1 && (
                                <span className={`text-xs font-medium ${diffPct > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                  {diffPct > 0 ? '▲' : '▼'} {Math.abs(diffPct).toFixed(1)}% عن السوق
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {o.paymentMethods.map((m) => (
                                <Badge key={m} variant="outline" className="text-xs">
                                  {methodIcon(m)} {methodLabel(m)}
                                </Badge>
                              ))}
                              <span className="text-xs text-muted-foreground ml-1">
                                {t('p2p.minOrder')}: {fmtEgp(o.minOrderEgp)} - {fmtEgp(o.maxOrderEgp)} EGP
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 md:items-end">
                          {o.user.id === user?.id ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelOffer(o.id)}
                            >
                              إلغاء الإعلان
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => {
                                setTakeOffer(o)
                                setTakeMethod(o.paymentMethods[0])
                                setTakeUsdt('')
                                setTakeEgp('')
                              }}
                            >
                              {o.type === 'SELL' ? t('p2p.buyFrom') : t('p2p.sellTo')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* My Offers */}
        <TabsContent value="myOffers" className="space-y-3">
          <MyOffers />
        </TabsContent>

        {/* My Trades */}
        <TabsContent value="myTrades" className="space-y-3">
          {/* Header with export button */}
          {myTrades.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {myTrades.length} صفقة
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => exportTradesCSV(myTrades)}
              >
                <Download className="w-3.5 h-3.5" />
                تصدير CSV
              </Button>
            </div>
          )}
          {myTrades.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{t('p2p.noTrades')}</p>
                <p className="text-xs mt-1">اذهب للسوق وابدأ صفقة</p>
              </CardContent>
            </Card>
          ) : (
            myTrades.map((trade) => {
              const isBuyer = trade.myRole === 'BUYER'
              return (
                <Card key={trade.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant={isBuyer ? 'default' : 'secondary'}>
                            {isBuyer ? t('p2p.buyer') : t('p2p.seller')}
                          </Badge>
                          <StatusBadge status={trade.status} />
                          <span className="text-xs text-muted-foreground">
                            {new Date(trade.createdAt).toLocaleString('en-US', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <div className="text-muted-foreground text-xs">الكمية</div>
                            <div className="font-semibold">{fmtUsdt(trade.usdtAmount)} USDT</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs">المبلغ</div>
                            <div className="font-semibold">{fmtEgp(trade.egpAmount)} EGP</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs">السعر</div>
                            <div className="font-semibold">{fmtEgp(trade.priceEgp)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs">طريقة الدفع</div>
                            <div className="font-semibold">
                              {methodIcon(trade.paymentMethod)} {methodLabel(trade.paymentMethod)}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 p-3 rounded-lg bg-muted/50 text-sm">
                          <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3" />
                              {t('p2p.counterparty')}
                            </div>
                            <button
                              onClick={() => setProfileUser({ id: trade.counterparty.id, name: trade.counterparty.name })}
                              className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5"
                            >
                              <UserCircle className="w-3 h-3" />
                              عرض الملف
                            </button>
                          </div>
                          <div className="font-medium">
                            {trade.counterparty.name}
                            {trade.counterparty.phone && (
                              <span className="text-muted-foreground mr-2">
                                · {trade.counterparty.phone}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Dispute banner */}
                        {trade.dispute && (
                          <div className="mt-2 p-2 rounded-lg bg-amber-100 dark:bg-amber-950 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <div>
                              <div className="font-medium">
                                {trade.dispute.status === 'OPEN' || trade.dispute.status === 'UNDER_REVIEW'
                                  ? '⏳ النزاع قيد المراجعة'
                                  : trade.dispute.status === 'RESOLVED_BUYER'
                                  ? '✅ تم الحل لصالح المشتري'
                                  : trade.dispute.status === 'RESOLVED_SELLER'
                                  ? '✅ تم الحل لصالح البائع'
                                  : '❌ تم إلغاء النزاع'}
                              </div>
                              {trade.dispute.resolution && (
                                <div className="opacity-80 mt-0.5">{trade.dispute.resolution}</div>
                              )}
                            </div>
                          </div>
                        )}
                        {/* Trade progress indicator */}
                        <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                          <TradeProgress status={trade.status} hasReview={!!trade.myReview} />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 md:w-56">
                        {/* Payment countdown — only while PENDING_PAYMENT */}
                        {trade.status === 'PENDING_PAYMENT' && (
                          <div className="flex justify-center">
                            <PaymentCountdown createdAt={trade.createdAt} status={trade.status} />
                          </div>
                        )}

                        {/* Action buttons */}
                        {isBuyer && trade.status === 'PENDING_PAYMENT' && (
                          <>
                            <p className="text-xs text-muted-foreground text-center">
                              {fmtEgp(trade.egpAmount)} EGP @ {methodLabel(trade.paymentMethod)}
                            </p>

                            {/* Receipt upload (optional but recommended) */}
                            <div className="space-y-1.5">
                              <label className="block">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                                  className="hidden"
                                />
                                <div className="cursor-pointer text-xs text-center py-2 px-3 rounded-lg border border-dashed border-border hover:bg-muted/30 transition-colors flex items-center justify-center gap-1.5">
                                  <ImageIcon className="w-3.5 h-3.5" />
                                  {receiptImage && markingPaidTradeId === trade.id ? 'تغيير الإيصال' : 'إرفاق إيصال (موصى به)'}
                                </div>
                              </label>
                              {receiptImage && markingPaidTradeId === trade.id && (
                                <div className="relative">
                                  <img src={receiptImage} alt="receipt" className="w-full rounded-lg border max-h-32 object-contain" />
                                  <button
                                    onClick={() => setReceiptImage(null)}
                                    className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5 hover:bg-background"
                                  >
                                    <XCircle className="w-4 h-4 text-rose-500" />
                                  </button>
                                </div>
                              )}
                            </div>

                            <Button
                              size="sm"
                              onClick={() => handleMarkPaid(trade.id)}
                              disabled={uploadingReceipt && markingPaidTradeId === trade.id}
                            >
                              {uploadingReceipt && markingPaidTradeId === trade.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                              أكدت الدفع
                            </Button>
                          </>
                        )}
                        {isBuyer && trade.status === 'PAID' && (
                          <p className="text-xs text-amber-600 text-center">
                            {t('p2p.waitingSeller')}
                          </p>
                        )}
                        {!isBuyer && trade.status === 'PAID' && (
                          <>
                            <p className="text-xs text-muted-foreground text-center">
                              {t('p2p.confirmedPayment')}
                            </p>
                            {/* Show receipt to seller if uploaded */}
                            {trade.paymentReference && trade.paymentReference.startsWith('/uploads/') && (
                              <a
                                href={trade.paymentReference}
                                target="_blank"
                                rel="noreferrer"
                                className="block"
                              >
                                <img
                                  src={trade.paymentReference}
                                  alt="payment receipt"
                                  className="w-full rounded-lg border max-h-32 object-contain cursor-pointer hover:opacity-80"
                                />
                                <div className="text-[10px] text-center text-muted-foreground mt-0.5">
                                  اضغط لعرض الإيصال بحجم أكبر
                                </div>
                              </a>
                            )}
                            <Button
                              size="sm"
                              onClick={() => handleTradeAction(trade.id, 'RELEASE')}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              إفراج عن USDT
                            </Button>
                          </>
                        )}
                        {!isBuyer && trade.status === 'PENDING_PAYMENT' && (
                          <p className="text-xs text-muted-foreground text-center">
                            {t('p2p.waitingBuyer')}
                          </p>
                        )}
                        {trade.status === 'RELEASED' && (
                          <p className="text-xs text-emerald-600 text-center font-medium">
                            {t('p2p.tradeCompleted')}
                          </p>
                        )}
                        {trade.status === 'CANCELLED' && (
                          <p className="text-xs text-muted-foreground text-center">
                            {t('p2p.cancelled')}
                          </p>
                        )}
                        {trade.status === 'DISPUTED' && (
                          <p className="text-xs text-amber-600 text-center font-medium">
                            ⚠️ الصفقة في نزاع — الإدارة تراجعها
                          </p>
                        )}

                        {/* Chat button — available while trade is active */}
                        {(trade.status === 'PENDING_PAYMENT' || trade.status === 'PAID' || trade.status === 'DISPUTED') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setChatTrade(trade)}
                            className="gap-2"
                          >
                            <MessageSquare className="w-4 h-4" />
                            محادثة + فتح نزاع
                          </Button>
                        )}

                        {/* Cancel button */}
                        {(trade.status === 'PENDING_PAYMENT' || trade.status === 'PAID') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCancelTradeId(trade.id)}
                          >
                            <XCircle className="w-4 h-4" />
                            إلغاء الصفقة
                          </Button>
                        )}

                        {/* Review form — show after RELEASED if user hasn't reviewed */}
                        {trade.status === 'RELEASED' && !trade.myReview && (
                          <ReviewForm
                            tradeId={trade.id}
                            counterpartyName={trade.counterparty.name}
                            onSubmitted={() => loadMyTrades()}
                          />
                        )}
                        {trade.status === 'RELEASED' && trade.myReview && (
                          <div className="text-xs text-muted-foreground text-center p-2 rounded bg-muted/30">
                            تقييمك:
                            <span className="inline-flex items-center gap-0.5 mr-1">
                              {Array.from({ length: trade.myReview.rating }).map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                              ))}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Take offer dialog */}
      <Dialog open={!!takeOffer} onOpenChange={(o) => !o && setTakeOffer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {takeOffer?.type === 'SELL' ? t('p2p.buyFrom') : t('p2p.sellTo')}
            </DialogTitle>
            <DialogDescription>
              @ {takeOffer?.user.name} @ {takeOffer && fmtEgp(takeOffer.priceEgp)} EGP/USDT
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Reputation summary */}
            {takeOffer && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground mb-1">البائع</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{takeOffer.user.name}</div>
                    <ReputationDisplay
                      ratingAvg={takeOffer.user.ratingAvg}
                      ratingCount={takeOffer.user.ratingCount}
                      tradesCount={takeOffer.user.tradesCount}
                      verified={takeOffer.user.verified}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Market price comparison */}
            {ticker && ticker.buyPriceEgp > 0 && takeOffer && (
              <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t('p2p.marketPriceNow')}</span>
                  <span className="font-num font-medium text-primary">{fmtEgp(ticker.buyPriceEgp)} EGP</span>
                </div>
                {(() => {
                  const diff = takeOffer.priceEgp - ticker.buyPriceEgp
                  const pct = ticker.buyPriceEgp > 0 ? (diff / ticker.buyPriceEgp) * 100 : 0
                  if (Math.abs(pct) < 0.1) return null
                  const isAbove = diff > 0
                  return (
                    <div className="flex items-center justify-between text-[10px] mt-1.5 pt-1.5 border-t border-border/30">
                      <span className="text-muted-foreground">الفرق عن السوق</span>
                      <span className={`font-num font-medium ${isAbove ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {isAbove ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}% ({isAbove ? '+' : ''}{diff.toFixed(2)} EGP)
                      </span>
                    </div>
                  )
                })()}
              </div>
            )}

            <div className="space-y-2">
              <Label>{t('p2p.amount')}</Label>
              <Input
                type="number"
                placeholder={`Max: ${takeOffer && fmtUsdt(takeOffer.usdtAmount)}`}
                value={takeUsdt}
                onChange={(e) => {
                  setTakeUsdt(e.target.value)
                  setTakeEgp('')
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>أو بالمبلغ (EGP)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={takeEgp}
                onChange={(e) => {
                  setTakeEgp(e.target.value)
                  setTakeUsdt('')
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('p2p.paymentMethods')}</Label>
              <div className="grid grid-cols-2 gap-2">
                {takeOffer?.paymentMethods.map((m) => (
                  <label
                    key={m}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      takeMethod === m ? 'bg-primary/10 border-primary' : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="radio"
                      checked={takeMethod === m}
                      onChange={() => setTakeMethod(m)}
                      className="accent-primary"
                    />
                    <span className="text-sm">
                      {methodIcon(m)} {methodLabel(m)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Summary */}
            {takeOffer && (takeUsdt || takeEgp) && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">السعر</span>
                  <span>{fmtEgp(takeOffer.priceEgp)} EGP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الكمية</span>
                  <span>
                    {fmtUsdt(takeUsdt ? Number(takeUsdt) : Number(takeEgp) / takeOffer.priceEgp)} USDT
                  </span>
                </div>
                <div className="flex justify-between font-bold border-t pt-1">
                  <span>{t('trade.totalDeducted')}</span>
                  <span>
                    {fmtEgp(takeEgp ? Number(takeEgp) : Number(takeUsdt) * takeOffer.priceEgp)} EGP
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTakeOffer(null)}>
              إلغاء
            </Button>
            <Button onClick={handleTakeOffer} disabled={taking || (!takeUsdt && !takeEgp)}>
              {taking ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              تأكيد الصفقة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trade chat dialog — full-screen on mobile for better UX */}
      <Dialog open={!!chatTrade} onOpenChange={(o) => !o && setChatTrade(null)}>
        <DialogContent className="max-w-lg p-0 max-h-[100dvh] sm:max-h-[90vh] h-[100dvh] sm:h-auto rounded-none sm:rounded-lg">
          {chatTrade && (
            <TradeChat
              trade={chatTrade}
              onClose={() => setChatTrade(null)}
              onTradeUpdated={() => loadMyTrades()}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel confirm */}
      <AlertDialog open={!!cancelTradeId} onOpenChange={(o) => !o && setCancelTradeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('p2p.confirmCancel')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('p2p.cancelDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>{t('common.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User profile dialog */}
      <UserProfileDialog
        userId={profileUser?.id || ''}
        userName={profileUser?.name || ''}
        open={!!profileUser}
        onOpenChange={(o) => !o && setProfileUser(null)}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: any }> = {
    PENDING_PAYMENT: { label: 'بانتظار الدفع', variant: 'secondary' },
    PAID: { label: 'تم الدفع', variant: 'default' },
    RELEASED: { label: 'مكتملة', variant: 'default' },
    DISPUTED: { label: 'نزاع', variant: 'destructive' },
    CANCELLED: { label: 'ملغاة', variant: 'outline' },
  }
  const { label, variant } = map[status] || { label: status, variant: 'outline' }
  return <Badge variant={variant}>{label}</Badge>
}
