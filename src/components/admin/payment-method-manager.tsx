'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, Edit, GripVertical, CreditCard, Wallet, Building2, Check } from 'lucide-react'
import { ImageUploader } from './image-uploader'
import { toast } from 'sonner'

type PaymentMethod = {
  id: string
  name: string
  nameAr: string
  icon: string
  logoUrl: string | null
  type: string
  active: boolean
  sortOrder: number
}

export function PaymentMethodManager() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<PaymentMethod | null>(null)
  const [creating, setCreating] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [icon, setIcon] = useState('💳')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [type, setType] = useState('WALLET')
  const [sortOrder, setSortOrder] = useState(0)
  const [active, setActive] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchMethods = useCallback(async () => {
    try {
      const res = await fetch('/api/payment-methods', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setMethods(data.methods || [])
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMethods()
  }, [fetchMethods])

  function openCreate() {
    setEditing(null)
    setCreating(true)
    setName('')
    setNameAr('')
    setIcon('💳')
    setLogoUrl(null)
    setType('WALLET')
    setSortOrder(methods.length + 1)
    setActive(true)
    setEditOpen(true)
  }

  function openEdit(m: PaymentMethod) {
    setEditing(m)
    setCreating(false)
    setName(m.name)
    setNameAr(m.nameAr)
    setIcon(m.icon)
    setLogoUrl(m.logoUrl)
    setType(m.type)
    setSortOrder(m.sortOrder)
    setActive(m.active)
    setEditOpen(true)
  }

  async function save() {
    if (!name || !nameAr) {
      toast.error('Name and Arabic name required')
      return
    }
    setSaving(true)
    try {
      if (creating) {
        const res = await fetch('/api/payment-methods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, nameAr, icon, logoUrl, type, sortOrder }),
          credentials: 'include',
        })
        if (!res.ok) throw new Error('Failed')
        toast.success('Payment method created')
      } else if (editing) {
        const res = await fetch('/api/payment-methods', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing.id, name, nameAr, icon, logoUrl, type, active, sortOrder }),
          credentials: 'include',
        })
        if (!res.ok) throw new Error('Failed')
        toast.success('Updated')
      }
      setEditOpen(false)
      fetchMethods()
    } catch {
      toast.error('Save failed')
    }
    setSaving(false)
  }

  async function toggleActive(m: PaymentMethod) {
    setMethods(prev => prev.map(p => p.id === m.id ? { ...p, active: !p.active } : p))
    await fetch('/api/payment-methods', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: m.id, active: !m.active }),
      credentials: 'include',
    })
  }

  async function remove(id: string) {
    setMethods(prev => prev.filter(p => p.id !== id))
    await fetch(`/api/payment-methods?id=${id}`, { method: 'DELETE', credentials: 'include' })
    toast.success('Deleted')
  }

  const typeIcon = type === 'WALLET' ? Wallet : type === 'BANK' ? Building2 : CreditCard
  const TypeIcon = typeIcon

  return (
    <Card className="glass border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            Payment Methods Management
          </h3>
          <Button size="sm" className="gap-1 h-7 text-xs" onClick={openCreate}>
            <Plus className="w-3 h-3" />
            Add Method
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-6 text-muted-foreground text-sm">Loading...</div>
        ) : methods.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">No payment methods</div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {methods.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                {/* Logo */}
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-background/50 border border-border/30 flex items-center justify-center flex-shrink-0">
                  {m.logoUrl ? (
                    <img src={m.logoUrl} alt={m.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-lg">{m.icon}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{m.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{m.nameAr}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[8px] h-3.5 px-1">{m.type}</Badge>
                    <span className="text-[9px] text-muted-foreground">Order: {m.sortOrder}</span>
                  </div>
                </div>

                {/* Active toggle */}
                <Switch checked={m.active} onCheckedChange={() => toggleActive(m)} />

                {/* Actions */}
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(m)}>
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-400" onClick={() => remove(m.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Edit/Create Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-md glass-strong border-border/50">
            <DialogHeader>
              <DialogTitle>{creating ? 'Add Payment Method' : 'Edit Payment Method'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Logo uploader */}
              <ImageUploader
                value={logoUrl}
                onChange={setLogoUrl}
                label="Logo / Icon Image"
              />

              {/* Icon emoji fallback */}
              <div>
                <Label className="text-xs">Icon (emoji, used if no logo)</Label>
                <Input
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="mt-1"
                  placeholder="💳"
                />
              </div>

              {/* Name */}
              <div>
                <Label className="text-xs">Name (English)</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                  placeholder="InstaPay"
                />
              </div>

              {/* Name Arabic */}
              <div>
                <Label className="text-xs">Name (Arabic)</Label>
                <Input
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="mt-1"
                  placeholder="إنستا باي"
                />
              </div>

              {/* Type */}
              <div>
                <Label className="text-xs">Type</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(['WALLET', 'BANK', 'CARD'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                        type === t ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort order */}
              <div>
                <Label className="text-xs">Sort Order</Label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="mt-1 font-num"
                />
              </div>

              {/* Active */}
              {!creating && (
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Active</Label>
                  <Switch checked={active} onCheckedChange={setActive} />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving} className="gap-1">
                {saving ? null : <Check className="w-3.5 h-3.5" />}
                {creating ? 'Create' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
