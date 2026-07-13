'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { COUNTRIES, type Country, DEFAULT_COUNTRY } from '@/lib/countries'
import { useLanguage } from '@/hooks/use-language'

type Props = {
  value: string // ISO alpha-2 code
  onChange: (code: string) => void
  className?: string
}

export function CountryCodeSelect({ value, onChange, className }: Props) {
  const { lang } = useLanguage()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = useMemo(
    () => COUNTRIES.find((c) => c.code === value) || DEFAULT_COUNTRY,
    [value],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return COUNTRIES
    return COUNTRIES.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.nameAr.includes(q) ||
      c.dialCode.includes(q) ||
      c.code.toLowerCase().includes(q),
    )
  }, [search])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setSearch('')
    }
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`h-11 px-3 gap-2 justify-between ${className || ''}`}
        >
          <span className="flex items-center gap-2">
            <span className="text-lg leading-none">{selected.flag}</span>
            <span className="font-num text-sm">{selected.dialCode}</span>
          </span>
          <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 glass-strong border-border/50" align="start">
        <div className="p-2 border-b border-border/50">
          <div className="relative">
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder={lang === 'ar' ? 'ابحث عن دولة...' : 'Search country...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pr-8 text-sm bg-background/50"
            />
          </div>
        </div>
        <ScrollArea className="h-[280px]">
          <div className="p-1">
            {filtered.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-6">
                {lang === 'ar' ? 'لا نتائج' : 'No results'}
              </div>
            ) : (
              filtered.map((c: Country) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    onChange(c.code)
                    setOpen(false)
                  }}
                  className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-sm hover:bg-muted/60 transition-colors ${
                    c.code === value ? 'bg-primary/10' : ''
                  }`}
                >
                  <span className="text-lg leading-none flex-shrink-0">{c.flag}</span>
                  <span className="flex-1 text-left truncate">
                    {lang === 'ar' ? c.nameAr : c.name}
                  </span>
                  <span className="font-num text-xs text-muted-foreground">{c.dialCode}</span>
                  {c.code === value && (
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
