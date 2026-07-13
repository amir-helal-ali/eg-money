'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import {
  apiCall, fmtEgp, fmtUsdt, useAuth, showSuccess, showError,
  PAYMENT_METHODS,
} from '@/lib/client'
import { useTicker } from '@/hooks/use-ticker'
import { Loader2, Edit2, XCircle, Clock, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react'
import { ReputationDisplay } from './review-form'

type MyOffer = {
  id: string
  type: 'BUY' | 'SELL'
  usdtAmount: number
  originalAmount: number
  priceEgp: number
  minOrderEgp: number
  maxOrderEgp: number
  paymentMethods: string[]
  status: string
  createdAt: string
  updatedAt: string
  stats: {
    completedTrades: number
    activeTrades: number
    totalTrades: number
    totalVolumeUsdt: number
  }
}

export function MyOffers() {
  const { user, fetchUser } = useAuth()
  const { data: ticker } = useTicker()
  const [offers, setOffers] = useState<MyOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<MyOffer | null>(null)

  // Edit form
  const [editPrice, setEditPrice] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editMin, setEditMin] = useState('')
  const [editMax, setEditMax] = useState('')
  const [editMethods, setEditMethods] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await apiCall<{ offers: MyOffer[] }>('/api/p2p/offers/mine')
    if (data) setOffers(data.offers)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openEdit(o: MyOffer) {
    setEditing(o)
    setEditPrice(o.priceEgp.toString())
    setEditAmount(o.usdtAmount.toString())
    setEditMin(o.minOrderEgp.toString())
    setEditMax(o.maxOrderEgp.toString())
    setEditMethods(o.paymentMethods)
  }

  async function saveEdit() {
    if (!editing) return
    setSaving(true)
    const { data, error } = await apiCall('/api/p2p/offers', {
      method: 'PATCH',
      body: JSON.stringify({
        id: editing.id,
        priceEgp: Number(editPrice),
        usdtAmount: Number(editAmount),
        minOrderEgp: Number(editMin),
        maxOrderEgp: Number(editMax),
        paymentMethods: editMethods,
      }),
    })
    setSaving(false)
    if (error) { showError(error); return }
    showSuccess(data?.message || 'تم التعديل')
    setEditing(null)
    await fetchUser()
    load()
  }

  async function cancelOffer(id: string) {
    if (!confirm('هل أنت متأكد من إلغاء هذا الإعلان؟ سيتم استرجاع USDT المحجوز.')) return
    const { data, error } = await apiCall(`/api/p2p/offers?id=${id}`, { method: 'DELETE' })
    if (error) { showError(error); return }
    showSuccess(data?.message || 'تم الإلغاء')
    await fetchUser()
    load()
  }

  const toggleMethod = (m: string) => {
    setEditMethods((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]))
  }

  if (loading) {
    return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
  }

  if (offers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد إعلانات منشورة</p>
          <p className="text-xs mt-1">ابدأ بنشر إعلان من زر "إنشاء إعلان"</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {offers.map((o) => {
        const marketPrice = o.type === 'SELL' ? (ticker?.buyPriceEgp || 0) : (ticker?.sellPriceEgp || 0)
        const diffPct = marketPrice > 0 ? ((o.priceEgp - marketPrice) / marketPrice) * 100 : 0
        const isOriginal = o.status === 'ACTIVE'
        return (
          <Card key={o.id} className={!isOriginal ? 'opacity-60' : ''}>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    o.type === 'SELL'
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                      : 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                  }`}>
                    {o.type === 'SELL' ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={o.type === 'SELL' ? 'default' : 'secondary'}>
                        {o.type === 'SELL' ? 'بيع' : 'شراء'}
                      </Badge>
                      <Badge variant={o.status === 'ACTIVE' ? 'outline' : 'secondary'}>
                        {o.status === 'ACTIVE' ? 'نشط' : o.status === 'CANCELLED' ? 'ملغي' : 'مكتمل'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(o.createdAt).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                      <span className="text-xl font-bold">{fmtEgp(o.priceEgp)}</span>
                      <span className="text-xs text-muted-foreground">EGP/USDT</span>
                      <span className="text-sm text-muted-foreground">
                        · متبقي: {fmtUsdt(o.usdtAmount)} USDT
                      </span>
                      {o.originalAmount !== o.usdtAmount && (
                        <span className="text-[10px] text-muted-foreground">
                          (من أصل {fmtUsdt(o.originalAmount)})
                        </span>
                      )}
                      {marketPrice > 0 && Math.abs(diffPct) >= 0.1 && (
                        <span className={`text-xs font-medium ${diffPct > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {diffPct > 0 ? '▲' : '▼'} {Math.abs(diffPct).toFixed(1)}% عن السوق
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {o.paymentMethods.map((m) => {
                        const method = PAYMENT_METHODS.find((p) => p.value === m)
                        return (
                          <Badge key={m} variant="outline" className="text-xs">
                            {method?.icon} {method?.label}
                          </Badge>
                        )
                      })}
                      <span className="text-xs text-muted-foreground ml-1">
                        الحد: {fmtEgp(o.minOrderEgp)} - {fmtEgp(o.maxOrderEgp)} EGP
                      </span>
                    </div>
                    {/* Stats row */}
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        {o.stats.completedTrades} مكتملة
                      </span>
                      {o.stats.activeTrades > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500" />
                          {o.stats.activeTrades} قيد التنفيذ
                        </span>
                      )}
                      {o.stats.totalVolumeUsdt > 0 && (
                        <span>إجمالي التداول: {fmtUsdt(o.stats.totalVolumeUsdt)} USDT</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 md:flex-col">
                  {isOriginal && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => openEdit(o)} className="gap-1">
                        <Edit2 className="w-3.5 h-3.5" />
                        تعديل
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => cancelOffer(o.id)} className="gap-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950">
                        <XCircle className="w-3.5 h-3.5" />
                        إلغاء
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل الإعلان</DialogTitle>
            <DialogDescription>
              يمكنك تعديل السعر، الكمية، الحدود، وطرق الدفع. للزيادة في الكمية (لإعلانات البيع) يجب أن يكون لديك رصيد USDT كافٍ.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label>السعر (EGP/USDT)</Label>
              <Input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="font-num" />
              {ticker && ticker.buyPriceEgp > 0 && (
                <button
                  type="button"
                  onClick={() => setEditPrice((editing?.type === 'BUY' ? ticker.buyPriceEgp : ticker.sellPriceEgp).toFixed(2))}
                  className="text-[10px] text-primary hover:underline"
                >
                  استخدم سعر السوق: {fmtEgp(editing?.type === 'BUY' ? ticker.buyPriceEgp : ticker.sellPriceEgp)}
                </button>
              )}
            </div>
            <div className="space-y-2">
              <Label>الكمية المتبقية (USDT)</Label>
              <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
              {editing?.type === 'SELL' && (
                <p className="text-xs text-muted-foreground">
                  رصيدك: {fmtUsdt(user?.usdtBalance || 0)} USDT
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>الحد الأدنى (EGP)</Label>
                <Input type="number" value={editMin} onChange={(e) => setEditMin(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>الحد الأقصى (EGP)</Label>
                <Input type="number" value={editMax} onChange={(e) => setEditMax(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>طرق الدفع</Label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <label
                    key={m.value}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      editMethods.includes(m.value) ? 'bg-primary/10 border-primary' : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <Checkbox checked={editMethods.includes(m.value)} onCheckedChange={() => toggleMethod(m.value)} />
                    <span className="text-sm">{m.icon} {m.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>إلغاء</Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
