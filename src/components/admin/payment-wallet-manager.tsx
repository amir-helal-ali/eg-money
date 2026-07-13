'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { apiCall, showSuccess, showError } from '@/lib/client'
import { useLanguage } from '@/hooks/use-language'
import {
  Loader2, Plus, Trash2, Edit3, RefreshCw, Wallet as WalletIcon,
  Phone, Check, X,
} from 'lucide-react'

type PaymentWallet = {
  id: string
  method: string
  number: string
  holderName: string
  label: string
  active: boolean
  sortOrder: number
  todayTotalEgp: number
  monthTotalEgp: number
  lastResetDate: string | null
  lastResetMonth: string | null
}

const METHOD_LABELS: Record<string, string> = {
  VODAFONE_CASH: 'فودافون كاش',
  INSTAPAY: 'إنستا باي',
  FAWRY: 'فوري',
  BANK_TRANSFER: 'تحويل بنكي',
}

const METHOD_ICONS: Record<string, string> = {
  VODAFONE_CASH: '📱',
  INSTAPAY: '⚡',
  FAWRY: '🏪',
  BANK_TRANSFER: '🏦',
}

export function PaymentWalletManager() {
  const { t } = useLanguage()
  const [wallets, setWallets] = useState<PaymentWallet[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<PaymentWallet | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formMethod, setFormMethod] = useState('VODAFONE_CASH')
  const [formNumber, setFormNumber] = useState('')
  const [formHolderName, setFormHolderName] = useState('')
  const [formLabel, setFormLabel] = useState('')
  const [formSortOrder, setFormSortOrder] = useState('0')

  async function loadWallets() {
    setLoading(true)
    const { data, error } = await apiCall<{ wallets: PaymentWallet[] }>('/api/admin/payment-wallets')
    setLoading(false)
    if (data) setWallets(data.wallets)
  }

  useEffect(() => {
    loadWallets()
  }, [])

  function openCreate() {
    setEditing(null)
    setFormMethod('VODAFONE_CASH')
    setFormNumber('')
    setFormHolderName('')
    setFormLabel('')
    setFormSortOrder('0')
    setEditOpen(true)
  }

  function openEdit(w: PaymentWallet) {
    setEditing(w)
    setFormMethod(w.method)
    setFormNumber(w.number)
    setFormHolderName(w.holderName)
    setFormLabel(w.label)
    setFormSortOrder(String(w.sortOrder))
    setEditOpen(true)
  }

  async function save() {
    if (!formNumber.trim()) {
      showError('الرقم مطلوب')
      return
    }
    setSaving(true)
    if (editing) {
      // Update
      const { error } = await apiCall('/api/admin/payment-wallets', {
        method: 'PATCH',
        body: JSON.stringify({
          id: editing.id,
          method: formMethod,
          number: formNumber,
          holderName: formHolderName,
          label: formLabel,
          sortOrder: Number(formSortOrder) || 0,
        }),
      })
      setSaving(false)
      if (error) { showError(error); return }
      showSuccess('تم تحديث المحفظة')
    } else {
      // Create
      const { error } = await apiCall('/api/admin/payment-wallets', {
        method: 'POST',
        body: JSON.stringify({
          method: formMethod,
          number: formNumber,
          holderName: formHolderName,
          label: formLabel,
          sortOrder: Number(formSortOrder) || 0,
        }),
      })
      setSaving(false)
      if (error) { showError(error); return }
      showSuccess('تم إضافة المحفظة')
    }
    setEditOpen(false)
    loadWallets()
  }

  async function toggleActive(w: PaymentWallet) {
    await apiCall('/api/admin/payment-wallets', {
      method: 'PATCH',
      body: JSON.stringify({ id: w.id, active: !w.active }),
    })
    loadWallets()
  }

  async function resetLimits(w: PaymentWallet) {
    await apiCall('/api/admin/payment-wallets', {
      method: 'PATCH',
      body: JSON.stringify({ id: w.id, resetLimits: true }),
    })
    showSuccess('تم إعادة تعيين الحدود')
    loadWallets()
  }

  async function deleteWallet(w: PaymentWallet) {
    if (!confirm(`حذف محفظة ${w.number}؟`)) return
    await apiCall(`/api/admin/payment-wallets?id=${w.id}`, { method: 'DELETE' })
    showSuccess('تم الحذف')
    loadWallets()
  }

  function fmt(n: number) {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)
  }

  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <WalletIcon className="w-4 h-4" />
            </div>
            محافظ الدفع
          </div>
          <Button size="sm" className="gap-1.5" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5" />
            إضافة
          </Button>
        </CardTitle>
        <CardDescription className="text-xs">
          أرقام المحافظ التي يستخدمها النظام لتوزيع الإيداعات تلقائياً (حد يومي/شهري)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="text-center py-6"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
        ) : wallets.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            لا توجد محافظ. اضغط "إضافة" لإنشاء محفظة جديدة.
          </div>
        ) : (
          wallets.map((w) => (
            <div key={w.id} className="rounded-xl border border-border/50 bg-background/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{METHOD_ICONS[w.method] || '💳'}</span>
                  <div>
                    <div className="font-semibold text-sm">{METHOD_LABELS[w.method] || w.method}</div>
                    <div className="font-num text-sm font-bold text-primary" dir="ltr">{w.number}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant={w.active ? 'default' : 'secondary'} className="text-[9px]">
                    {w.active ? 'نشط' : 'معطّل'}
                  </Badge>
                  <Switch checked={w.active} onCheckedChange={() => toggleActive(w)} />
                </div>
              </div>

              {w.holderName && (
                <div className="text-xs text-muted-foreground">اسم الحساب: {w.holderName}</div>
              )}
              {w.label && (
                <div className="text-xs text-muted-foreground">الوصف: {w.label}</div>
              )}

              {/* Limits tracking */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="rounded-lg bg-muted/30 p-2">
                  <div className="text-[9px] text-muted-foreground uppercase">اليوم</div>
                  <div className="font-num text-sm font-bold">{fmt(w.todayTotalEgp)} EGP</div>
                </div>
                <div className="rounded-lg bg-muted/30 p-2">
                  <div className="text-[9px] text-muted-foreground uppercase">الشهر</div>
                  <div className="font-num text-sm font-bold">{fmt(w.monthTotalEgp)} EGP</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1.5 pt-1">
                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => openEdit(w)}>
                  <Edit3 className="w-3 h-3" /> تعديل
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-blue-400" onClick={() => resetLimits(w)}>
                  <RefreshCw className="w-3 h-3" /> إعادة تعيين
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-rose-400" onClick={() => deleteWallet(w)}>
                  <Trash2 className="w-3 h-3" /> حذف
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>

      {/* Edit/Create dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل محفظة' : 'محفظة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Method */}
            <div className="space-y-1.5">
              <Label className="text-xs">طريقة الدفع</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(METHOD_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFormMethod(key)}
                    className={`p-2 rounded-lg border-2 text-center text-xs font-medium transition-all ${
                      formMethod === key ? 'border-primary bg-primary/10' : 'border-border/50'
                    }`}
                  >
                    {METHOD_ICONS[key]} {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Number */}
            <div className="space-y-1.5">
              <Label className="text-xs">رقم المحفظة / الحساب</Label>
              <Input
                value={formNumber}
                onChange={(e) => setFormNumber(e.target.value)}
                placeholder="01000000000"
                className="font-num"
                dir="ltr"
              />
            </div>

            {/* Holder name */}
            <div className="space-y-1.5">
              <Label className="text-xs">اسم صاحب الحساب (اختياري)</Label>
              <Input
                value={formHolderName}
                onChange={(e) => setFormHolderName(e.target.value)}
                placeholder="Ahmed Mohamed"
              />
            </div>

            {/* Label */}
            <div className="space-y-1.5">
              <Label className="text-xs">وصف (اختياري)</Label>
              <Input
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="محفظة 1"
              />
            </div>

            {/* Sort order */}
            <div className="space-y-1.5">
              <Label className="text-xs">ترتيب العرض</Label>
              <Input
                type="number"
                value={formSortOrder}
                onChange={(e) => setFormSortOrder(e.target.value)}
                className="font-num"
                dir="ltr"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>إلغاء</Button>
            <Button className="gap-1.5" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {editing ? 'حفظ' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
