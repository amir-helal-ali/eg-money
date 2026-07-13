'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, X, Filter, ArrowDownUp } from 'lucide-react'
import { PAYMENT_METHODS, methodLabel, methodIcon } from '@/lib/client'
import { cn } from '@/lib/utils'

export type P2pFilters = {
  type: 'ALL' | 'BUY' | 'SELL'
  paymentMethod: string | null
  minPrice: string
  maxPrice: string
  minAmount: string
  maxAmount: string
  search: string
  sort: 'price_asc' | 'price_desc' | 'newest' | 'amount_desc'
}

export const DEFAULT_FILTERS: P2pFilters = {
  type: 'ALL',
  paymentMethod: null,
  minPrice: '',
  maxPrice: '',
  minAmount: '',
  maxAmount: '',
  search: '',
  sort: 'price_asc',
}

type Props = {
  filters: P2pFilters
  onChange: (f: P2pFilters) => void
  tickerPrice?: number // for showing price filter presets
}

const SORT_OPTIONS: { value: P2pFilters['sort']; label: string }[] = [
  { value: 'price_asc', label: 'أفضل سعر' },
  { value: 'price_desc', label: 'أعلى سعر' },
  { value: 'newest', label: 'الأحدث' },
  { value: 'amount_desc', label: 'أكبر كمية' },
]

export function OfferFilters({ filters, onChange, tickerPrice }: Props) {
  const update = (patch: Partial<P2pFilters>) => onChange({ ...filters, ...patch })
  const toggleMethod = (m: string) => {
    update({ paymentMethod: filters.paymentMethod === m ? null : m })
  }
  const reset = () => onChange(DEFAULT_FILTERS)

  const hasActiveFilters =
    filters.paymentMethod !== null ||
    filters.minPrice !== '' ||
    filters.maxPrice !== '' ||
    filters.minAmount !== '' ||
    filters.maxAmount !== '' ||
    filters.search !== '' ||
    filters.sort !== 'price_asc'

  return (
    <div className="space-y-3 p-3 rounded-xl border bg-card/50">
      {/* Row 1: Type tabs + Search + Sort */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border bg-background p-0.5">
          {(['ALL', 'BUY', 'SELL'] as const).map((t) => (
            <button
              key={t}
              onClick={() => update({ type: t })}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                filters.type === t
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t === 'ALL' ? 'الكل' : t === 'BUY' ? 'شراء' : 'بيع'}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-[180px] relative">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="ابحث باسم المستخدم..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="pr-8 h-8 text-sm"
          />
        </div>

        <div className="relative">
          <select
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value as P2pFilters['sort'] })}
            className="h-8 pl-7 pr-2 text-xs rounded-md border bg-background appearance-none cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ArrowDownUp className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={reset} className="h-8 text-xs gap-1">
            <X className="w-3 h-3" />
            مسح
          </Button>
        )}
      </div>

      {/* Row 2: Payment methods */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Filter className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground ml-1">طريقة الدفع:</span>
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m.value}
            onClick={() => toggleMethod(m.value)}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full border transition-colors',
              filters.paymentMethod === m.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            <span>{methodIcon(m.value)}</span>
            {methodLabel(m.value)}
          </button>
        ))}
      </div>

      {/* Row 3: Price + amount range */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Input
          type="number"
          placeholder={`سعر من${tickerPrice ? ` (≈ ${tickerPrice})` : ''}`}
          value={filters.minPrice}
          onChange={(e) => update({ minPrice: e.target.value })}
          className="h-8 text-xs"
        />
        <Input
          type="number"
          placeholder="سعر إلى"
          value={filters.maxPrice}
          onChange={(e) => update({ maxPrice: e.target.value })}
          className="h-8 text-xs"
        />
        <Input
          type="number"
          placeholder="كمية USDT من"
          value={filters.minAmount}
          onChange={(e) => update({ minAmount: e.target.value })}
          className="h-8 text-xs"
        />
        <Input
          type="number"
          placeholder="كمية USDT إلى"
          value={filters.maxAmount}
          onChange={(e) => update({ maxAmount: e.target.value })}
          className="h-8 text-xs"
        />
      </div>
    </div>
  )
}
