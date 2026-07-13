'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { apiCall, fmtEgp, fmtUsdt, showSuccess, showError } from '@/lib/client'
import { Loader2, Users, ArrowRightLeft, CheckCircle2, XCircle, Clock, AlertTriangle, Scale, MessageSquare } from 'lucide-react'
import { TradeChat } from '@/components/p2p/trade-chat'

type P2pOfferAdmin = {
  id: string
  type: string
  usdtAmount: number
  priceEgp: number
  status: string
  createdAt: string
  user: { id: string; email: string; name: string | null; username: string }
}

type P2pTradeAdmin = {
  id: string
  usdtAmount: number
  egpAmount: number
  priceEgp: number
  paymentMethod: string
  status: string
  createdAt: string
  releasedAt: string | null
  buyer: { id: string; email: string; name: string | null; username: string }
  seller: { id: string; email: string; name: string | null; username: string }
}

type DisputeTrade = {
  id: string
  usdtAmount: number
  egpAmount: number
  priceEgp: number
  paymentMethod: string
  status: string
  createdAt: string
  disputedAt: string | null
  buyerId: string
  sellerId: string
  buyer: { id: string; name: string | null; username: string; email: string }
  seller: { id: string; name: string | null; username: string; email: string }
  offer: { id: string; type: string; paymentMethods: string }
  messages: { id: string; senderId: string; message: string; createdAt: string; sender: { id: string; name: string | null; username: string } }[]
}

type DisputeAdmin = {
  id: string
  reason: string
  description: string
  status: string
  resolution: string | null
  createdAt: string
  resolvedAt: string | null
  openedBy: { id: string; name: string | null; username: string }
  resolvedBy: { id: string; name: string | null; username: string } | null
  trade: DisputeTrade
}

export function AdminP2P() {
  const [offers, setOffers] = useState<P2pOfferAdmin[]>([])
  const [trades, setTrades] = useState<P2pTradeAdmin[]>([])
  const [disputes, setDisputes] = useState<DisputeAdmin[]>([])
  const [stats, setStats] = useState({ activeOffers: 0, completedTrades: 0, pendingTrades: 0, cancelledTrades: 0 })
  const [loading, setLoading] = useState(true)
  const [subtab, setSubtab] = useState('trades')

  // Dispute resolution dialog state
  const [resolvingDispute, setResolvingDispute] = useState<DisputeAdmin | null>(null)
  const [resolution, setResolution] = useState<'RESOLVED_BUYER' | 'RESOLVED_SELLER' | 'CANCELLED'>('RESOLVED_BUYER')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [resolving, setResolving] = useState(false)
  const [chatDispute, setChatDispute] = useState<DisputeAdmin | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await apiCall<{ offers: P2pOfferAdmin[]; trades: P2pTradeAdmin[]; stats: any }>('/api/admin/p2p')
    if (data) {
      setOffers(data.offers)
      setTrades(data.trades)
      setStats(data.stats)
    }
    // Load disputes separately (open ones first)
    const { data: disputesData } = await apiCall<{ disputes: DisputeAdmin[] }>('/api/admin/p2p-disputes')
    if (disputesData) setDisputes(disputesData.disputes)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleResolve() {
    if (!resolvingDispute) return
    setResolving(true)
    const { data, error } = await apiCall('/api/admin/p2p-disputes', {
      method: 'PATCH',
      body: JSON.stringify({
        disputeId: resolvingDispute.id,
        resolution,
        notes: resolutionNotes,
      }),
    })
    setResolving(false)
    if (error) {
      showError(error)
      return
    }
    showSuccess(data?.message || 'تم حل النزاع')
    setResolvingDispute(null)
    setResolutionNotes('')
    load()
  }

  const statusColors: Record<string, string> = {
    ACTIVE: 'text-emerald-500',
    COMPLETED: 'text-blue-400',
    CANCELLED: 'text-rose-400',
    RELEASED: 'text-emerald-500',
    PENDING_PAYMENT: 'text-amber-500',
    PAID: 'text-blue-400',
    PENDING: 'text-amber-500',
    DISPUTED: 'text-rose-500',
  }

  const statusLabels: Record<string, string> = {
    ACTIVE: 'نشط',
    COMPLETED: 'مكتمل',
    CANCELLED: 'ملغي',
    RELEASED: 'مُفرج',
    PENDING_PAYMENT: 'بانتظار الدفع',
    PAID: 'مدفوع',
    PENDING: 'قيد الانتظار',
    DISPUTED: 'نزاع',
  }

  const openDisputeCount = disputes.filter((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length

  if (loading) {
    return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
  }

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <StatBox label="عروض نشطة" value={stats.activeOffers} icon={Users} color="text-emerald-500" />
        <StatBox label="صفقات مكتملة" value={stats.completedTrades} icon={CheckCircle2} color="text-blue-400" />
        <StatBox label="قيد التنفيذ" value={stats.pendingTrades} icon={Clock} color="text-amber-500" />
        <StatBox label="ملغاة" value={stats.cancelledTrades} icon={XCircle} color="text-rose-400" />
      </div>

      <Tabs value={subtab} onValueChange={setSubtab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="trades">الصفقات</TabsTrigger>
          <TabsTrigger value="offers">العروض</TabsTrigger>
          <TabsTrigger value="disputes">
            النزاعات
            {openDisputeCount > 0 && (
              <Badge variant="destructive" className="mr-1 text-[9px] h-4 px-1">
                {openDisputeCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Trades */}
        <TabsContent value="trades" className="space-y-2 mt-3">
          {trades.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">لا توجد صفقات P2P</CardContent></Card>
          ) : (
            trades.slice(0, 50).map((t) => (
              <Card key={t.id}>
                <CardContent className="p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
                      <span className="font-num text-sm font-bold">{fmtUsdt(t.usdtAmount)} USDT</span>
                      <span className="text-[10px] text-muted-foreground">@ {fmtEgp(t.priceEgp)}</span>
                    </div>
                    <Badge variant="outline" className={`text-[9px] ${statusColors[t.status] || 'text-muted-foreground'}`}>
                      {statusLabels[t.status] || t.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>المشتري: <span className="font-medium text-foreground">{t.buyer.name || t.buyer.username}</span></span>
                    <span>·</span>
                    <span>البائع: <span className="font-medium text-foreground">{t.seller.name || t.seller.username}</span></span>
                  </div>
                  <div className="text-[9px] text-muted-foreground">
                    {fmtEgp(t.egpAmount)} EGP · {t.paymentMethod} · {new Date(t.createdAt).toLocaleString('ar-EG')}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Offers */}
        <TabsContent value="offers" className="space-y-2 mt-3">
          {offers.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">لا توجد عروض P2P</CardContent></Card>
          ) : (
            offers.slice(0, 50).map((o) => (
              <Card key={o.id}>
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={o.type === 'BUY' ? 'text-emerald-500' : 'text-rose-400'}>
                        {o.type === 'BUY' ? 'شراء' : 'بيع'}
                      </Badge>
                      <span className="font-num text-sm font-bold">{fmtUsdt(o.usdtAmount)} USDT</span>
                      <span className="text-[10px] text-muted-foreground">@ {fmtEgp(o.priceEgp)}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {o.user.name || o.user.username} · {o.user.email}
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[9px] ${statusColors[o.status] || 'text-muted-foreground'}`}>
                    {statusLabels[o.status] || o.status}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Disputes */}
        <TabsContent value="disputes" className="space-y-2 mt-3">
          {disputes.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                <Scale className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>لا توجد نزاعات</p>
                <p className="text-xs mt-1">النزاعات التي يفتحها المستخدمون ستظهر هنا</p>
              </CardContent>
            </Card>
          ) : (
            disputes.map((d) => {
              const isOpen = d.status === 'OPEN' || d.status === 'UNDER_REVIEW'
              const reasonLabels: Record<string, string> = {
                NO_PAYMENT: 'المشتري لم يدفع',
                NO_RELEASE: 'البائع لم يفرج',
                OTHER: 'سبب آخر',
              }
              return (
                <Card key={d.id} className={isOpen ? 'border-amber-300' : ''}>
                  <CardContent className="p-3 space-y-2">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`w-4 h-4 ${isOpen ? 'text-amber-500' : 'text-muted-foreground'}`} />
                        <Badge variant="outline" className="text-[9px]">
                          {reasonLabels[d.reason] || d.reason}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(d.createdAt).toLocaleString('ar-EG')}
                        </span>
                      </div>
                      <Badge variant={isOpen ? 'destructive' : 'outline'} className="text-[9px]">
                        {d.status === 'OPEN' ? 'مفتوح'
                          : d.status === 'UNDER_REVIEW' ? 'قيد المراجعة'
                          : d.status === 'RESOLVED_BUYER' ? 'حُل لصالح المشتري'
                          : d.status === 'RESOLVED_SELLER' ? 'حُل لصالح البائع'
                          : 'ملغي'}
                      </Badge>
                    </div>

                    {/* Trade details */}
                    <div className="rounded bg-muted/30 p-2 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-num font-bold">{fmtUsdt(d.trade.usdtAmount)} USDT</span>
                        <span className="text-muted-foreground">@ {fmtEgp(d.trade.priceEgp)} EGP</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        المشتري: <span className="text-foreground">{d.trade.buyer.name || d.trade.buyer.username}</span>
                        {' · '}
                        البائع: <span className="text-foreground">{d.trade.seller.name || d.trade.seller.username}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {fmtEgp(d.trade.egpAmount)} EGP · {d.trade.paymentMethod}
                      </div>
                    </div>

                    {/* Dispute description */}
                    <div className="text-xs">
                      <div className="text-muted-foreground text-[10px] mb-0.5">وصف النزاع (من {d.openedBy.name || d.openedBy.username}):</div>
                      <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-foreground">
                        {d.description}
                      </div>
                    </div>

                    {/* Resolution (if resolved) */}
                    {d.resolution && (
                      <div className="text-xs">
                        <div className="text-muted-foreground text-[10px] mb-0.5">قرار الإدارة ({d.resolvedBy?.name || d.resolvedBy?.username || '—'}):</div>
                        <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                          {d.resolution}
                        </div>
                      </div>
                    )}

                    {/* Action button */}
                    {isOpen && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1.5"
                          onClick={() => setChatDispute(d)}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          فتح المحادثة
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 gap-2"
                          onClick={() => {
                            setResolvingDispute(d)
                            setResolution('RESOLVED_BUYER')
                            setResolutionNotes('')
                          }}
                        >
                          <Scale className="w-4 h-4" />
                          حل النزاع
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Resolve dispute dialog */}
      <Dialog open={!!resolvingDispute} onOpenChange={(o) => !o && setResolvingDispute(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>حل النزاع</DialogTitle>
            <DialogDescription>
              اختر الطرف الذي سيفوز بالأموال. سيتم تطبيق القرار فوراً.
            </DialogDescription>
          </DialogHeader>

          {resolvingDispute && (
            <div className="space-y-3">
              {/* Trade summary */}
              <div className="rounded border bg-muted/30 p-3 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">الصفقة</span>
                  <span className="font-num">{fmtUsdt(resolvingDispute.trade.usdtAmount)} USDT @ {fmtEgp(resolvingDispute.trade.priceEgp)} EGP</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  المشتري: <span className="text-foreground">{resolvingDispute.trade.buyer.name || resolvingDispute.trade.buyer.username}</span>
                  {' · '}
                  البائع: <span className="text-foreground">{resolvingDispute.trade.seller.name || resolvingDispute.trade.seller.username}</span>
                </div>
              </div>

              {/* Reason */}
              <div className="text-sm">
                <div className="text-xs text-muted-foreground mb-1">السبب المعلن:</div>
                <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs">
                  {resolvingDispute.description}
                </div>
              </div>

              {/* Messages preview */}
              {resolvingDispute.trade.messages.length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    عرض المحادثات ({resolvingDispute.trade.messages.length} رسالة)
                  </summary>
                  <div className="mt-2 max-h-40 overflow-y-auto p-2 rounded bg-muted/30 space-y-1.5">
                    {resolvingDispute.trade.messages.map((m) => (
                      <div key={m.id} className={`text-xs ${m.senderId === resolvingDispute.trade.buyerId ? 'text-blue-500' : 'text-emerald-500'}`}>
                        <span className="font-medium">{m.sender.name || m.sender.username}:</span>
                        <span className="text-foreground mr-1"> {m.message}</span>
                        <span className="text-muted-foreground text-[10px]">
                          {' '}· {new Date(m.createdAt).toLocaleString('ar-EG')}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Resolution options */}
              <div className="space-y-2">
                <div className="text-sm font-medium">القرار:</div>
                {[
                  { value: 'RESOLVED_BUYER', label: 'لصالح المشتري — يستلم USDT + EGP', color: 'border-blue-300 bg-blue-50 dark:bg-blue-950/30' },
                  { value: 'RESOLVED_SELLER', label: 'لصالح البائع — يستلم EGP', color: 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30' },
                  { value: 'CANCELLED', label: 'إلغاء — استرجاع الأموال للطرفين', color: 'border-amber-300 bg-amber-50 dark:bg-amber-950/30' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      resolution === opt.value ? opt.color : 'border-border hover:bg-muted/30'
                    }`}
                  >
                    <input
                      type="radio"
                      checked={resolution === opt.value}
                      onChange={() => setResolution(opt.value as any)}
                      className="accent-primary"
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">ملاحظات الإدارة (اختياري):</div>
                <Textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="اشرح سبب القرار..."
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setResolvingDispute(null)}>إلغاء</Button>
            <Button onClick={handleResolve} disabled={resolving} variant="default">
              {resolving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              تأكيد القرار
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin chat dialog — full-screen on mobile */}
      <Dialog open={!!chatDispute} onOpenChange={(o) => !o && setChatDispute(null)}>
        <DialogContent className="max-w-lg p-0 max-h-[100dvh] sm:max-h-[90vh] h-[100dvh] sm:h-auto rounded-none sm:rounded-lg">
          {chatDispute && (
            <TradeChat
              trade={{
                id: chatDispute.trade.id,
                usdtAmount: chatDispute.trade.usdtAmount,
                egpAmount: chatDispute.trade.egpAmount,
                priceEgp: chatDispute.trade.priceEgp,
                paymentMethod: chatDispute.trade.paymentMethod,
                status: chatDispute.trade.status,
                myRole: 'ADMIN',
                counterparty: {
                  id: chatDispute.trade.buyerId,
                  name: chatDispute.trade.buyer.name || chatDispute.trade.buyer.username,
                  phone: null,
                },
                offer: {
                  id: chatDispute.trade.offer.id,
                  type: chatDispute.trade.offer.type,
                  paymentMethods: [],
                },
              }}
              onClose={() => setChatDispute(null)}
              onTradeUpdated={load}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatBox({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="rounded-lg bg-muted/30 p-2.5 text-center">
      <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
      <div className={`font-num text-lg font-bold ${color}`}>{value}</div>
      <div className="text-[9px] text-muted-foreground">{label}</div>
    </div>
  )
}
