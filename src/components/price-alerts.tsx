'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, Check } from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'
import { useTicker } from '@/hooks/use-ticker'
import { toast } from 'sonner'
import { fmtEgp } from '@/lib/client'

type Alert = {
  id: string
  condition: string
  targetPrice: number
  status: string
  createdAt: string
  triggeredAt: string | null
}

export function PriceAlerts() {
  const { lang, t } = useLanguage()
  const { data: tickerData } = useTicker()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [open, setOpen] = useState(false)
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE')
  const [targetPrice, setTargetPrice] = useState('')
  const [loading, setLoading] = useState(false)

  const currentPrice = tickerData?.buyPriceEgp || 0

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/price-alerts', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
         
        setAlerts(data.alerts || [])
      }
    } catch {}
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAlerts()
    // Poll every 30 seconds for status updates
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [fetchAlerts])

  async function createAlert() {
    if (!targetPrice || isNaN(Number(targetPrice))) {
      toast.error(lang === 'ar' ? 'أدخل سعراً صحيحاً' : 'Enter a valid price')
      return
    }
    setLoading(true)
    const res = await fetch('/api/price-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ condition, targetPrice: Number(targetPrice) }),
      credentials: 'include',
    })
    setLoading(false)
    if (res.ok) {
      toast.success(lang === 'ar' ? 'تم إنشاء التنبيه' : 'Alert created')
      setOpen(false)
      setTargetPrice('')
      fetchAlerts()
    } else {
      const data = await res.json()
      toast.error(data.error || 'Error')
    }
  }

  async function cancelAlert(id: string) {
    setAlerts(prev => prev.filter(a => a.id !== id))
    await fetch(`/api/price-alerts?id=${id}`, { method: 'DELETE', credentials: 'include' })
    toast.success(lang === 'ar' ? 'تم إلغاء التنبيه' : 'Alert cancelled')
  }

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE')
  const triggeredAlerts = alerts.filter(a => a.status === 'TRIGGERED')

  return (
    <Card className="glass border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">
              {lang === 'ar' ? 'تنبيهات الأسعار' : 'Price Alerts'}
            </span>
            {activeAlerts.length > 0 && (
              <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-primary/15 text-primary">
                {activeAlerts.length} {lang === 'ar' ? 'نشط' : 'active'}
              </Badge>
            )}
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs">
                <Plus className="w-3 h-3" />
                {lang === 'ar' ? 'تنبيه جديد' : 'New Alert'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm glass-strong border-border/50">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  {lang === 'ar' ? 'إنشاء تنبيه سعر' : 'Create Price Alert'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Current price */}
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <div className="text-[10px] text-muted-foreground mb-1">
                    {lang === 'ar' ? 'السعر الحالي' : 'Current Price'}
                  </div>
                  <div className="font-num text-xl font-bold text-primary">
                    {fmtEgp(currentPrice)} <span className="text-xs text-muted-foreground">EGP</span>
                  </div>
                </div>

                {/* Condition */}
                <div>
                  <Label2>{lang === 'ar' ? 'الشرط' : 'Condition'}</Label2>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={() => setCondition('ABOVE')}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors ${
                        condition === 'ABOVE' ? 'bg-success/10 border-success text-success' : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {lang === 'ar' ? 'فوق' : 'Above'}
                      </span>
                    </button>
                    <button
                      onClick={() => setCondition('BELOW')}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors ${
                        condition === 'BELOW' ? 'bg-rose-500/10 border-rose-500 text-rose-400' : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <TrendingDown className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {lang === 'ar' ? 'تحت' : 'Below'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Target price */}
                <div>
                  <Label2>{lang === 'ar' ? 'السعر المستهدف (EGP)' : 'Target Price (EGP)'}</Label2>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={lang === 'ar' ? 'مثال: 50.00' : 'e.g. 50.00'}
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="mt-1 font-num"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} className="text-xs">
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={createAlert} disabled={loading} className="text-xs gap-1">
                  {loading ? null : <Check className="w-3 h-3" />}
                  {lang === 'ar' ? 'إنشاء' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Alerts list */}
        {alerts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-xs">
              {lang === 'ar' ? 'لا توجد تنبيهات. أنشئ تنبيهاً ليُعلمك عند وصول السعر لمستوى معين.' : 'No alerts yet. Create one to get notified when price reaches a level.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {activeAlerts.map(a => (
              <div key={a.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  {a.condition === 'ABOVE' ? (
                    <TrendingUp className="w-4 h-4 text-success" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                  )}
                  <div>
                    <div className="text-sm font-medium">
                      {a.condition === 'ABOVE'
                        ? (lang === 'ar' ? 'فوق' : 'Above')
                        : (lang === 'ar' ? 'تحت' : 'Below')}{' '}
                      <span className="font-num">{fmtEgp(a.targetPrice)}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {lang === 'ar' ? 'السعر الحالي' : 'Current'}: {fmtEgp(currentPrice)}
                    </div>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-rose-400"
                  onClick={() => cancelAlert(a.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
            {triggeredAlerts.slice(0, 3).map(a => (
              <div key={a.id} className="flex items-center justify-between p-2.5 rounded-lg bg-success/5 opacity-60">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <div>
                    <div className="text-sm font-medium line-through">
                      {a.condition === 'ABOVE' ? '↑' : '↓'} {fmtEgp(a.targetPrice)}
                    </div>
                    <div className="text-[10px] text-success">
                      {lang === 'ar' ? 'تم التفعيل' : 'Triggered'}
                    </div>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={() => cancelAlert(a.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Label2({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-medium text-muted-foreground">{children}</label>
}
