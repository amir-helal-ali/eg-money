'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bookmark, Trash2, Plus, X } from 'lucide-react'
import { getTemplates, saveTemplate, deleteTemplate, type OfferTemplate, type OfferTemplate as _OT } from '@/lib/p2p-templates'
import { PAYMENT_METHODS, methodLabel, methodIcon, fmtEgp, fmtUsdt } from '@/lib/client'
import { cn } from '@/lib/utils'

type Props = {
  /** Called when a template is selected — fills the parent form with the values */
  onSelect: (template: OfferTemplate) => void
  /** Current form values (used for the "save as template" button) */
  currentForm: {
    type: 'BUY' | 'SELL'
    usdtAmount: string
    priceEgp: string
    minOrderEgp: string
    maxOrderEgp: string
    paymentMethods: string[]
  }
  /** Triggered when templates list changes (so parent can refresh) */
  onChanged?: () => void
}

export function TemplatePicker({ onSelect, currentForm, onChanged }: Props) {
  const [templates, setTemplates] = useState<OfferTemplate[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [label, setLabel] = useState('')

  function refresh() {
    setTemplates(getTemplates())
  }

  useEffect(() => {
    refresh()
  }, [])

  function handleSave() {
    if (!label.trim()) return
    saveTemplate({
      label: label.trim(),
      ...currentForm,
    })
    setLabel('')
    setShowSaveDialog(false)
    refresh()
    onChanged?.()
  }

  function handleDelete(id: string) {
    if (!confirm('حذف هذا القالب؟')) return
    deleteTemplate(id)
    refresh()
    onChanged?.()
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Bookmark className="w-3 h-3" />
          قوالب الإعلانات
        </div>
        <button
          type="button"
          onClick={() => setShowSaveDialog((s) => !s)}
          className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5"
        >
          <Plus className="w-3 h-3" />
          حفظ كقالب
        </button>
      </div>

      {/* Save-as-template form */}
      {showSaveDialog && (
        <div className="flex gap-1.5 items-center p-2 rounded border bg-muted/30">
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="اسم القالب (مثال: بيع 100 USDT)"
            className="h-7 text-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSave()
              }
            }}
          />
          <Button size="sm" type="button" className="h-7 px-2" onClick={handleSave} disabled={!label.trim()}>
            حفظ
          </Button>
          <Button size="sm" type="button" variant="ghost" className="h-7 w-7 p-0" onClick={() => setShowSaveDialog(false)}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Templates list */}
      {templates.length === 0 ? (
        <div className="text-[10px] text-muted-foreground text-center py-2">
          لا توجد قوالب محفوظة. أنشئ قالباً لتسريع إنشاء الإعلانات المستقبلية.
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="group inline-flex items-center gap-1 rounded-full border bg-background pr-1 pl-2 py-0.5 text-[10px] hover:border-primary/50 transition-colors"
            >
              <button
                type="button"
                onClick={() => onSelect(tpl)}
                className="inline-flex items-center gap-1"
                title={`استخدام القالب: ${tpl.label}`}
              >
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-full text-[9px] font-medium',
                    tpl.type === 'SELL'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
                  )}
                >
                  {tpl.type === 'SELL' ? 'بيع' : 'شراء'}
                </span>
                <span className="font-medium">{tpl.label}</span>
                <span className="text-muted-foreground">
                  {fmtUsdt(Number(tpl.usdtAmount) || 0)}
                </span>
                {tpl.paymentMethods.slice(0, 2).map((m) => (
                  <span key={m} className="opacity-60">{methodIcon(m)}</span>
                ))}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(tpl.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-rose-500"
                title="حذف القالب"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
