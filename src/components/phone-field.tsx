'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CountryCodeSelect } from '@/components/country-code-select'
import { DEFAULT_COUNTRY } from '@/lib/countries'
import { AlertCircle } from 'lucide-react'
import { useState } from 'react'

type Props = {
  id: string
  label: string
  placeholder: string
  value: string
  onPhoneChange: (v: string) => void
  countryCode: string
  onCountryChange: (code: string) => void
  error?: string
  dir?: 'ltr' | 'rtl'
}

export function PhoneField({
  id, label, placeholder, value, onPhoneChange,
  countryCode, onCountryChange, error, dir,
}: Props) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs uppercase tracking-wider font-medium">{label}</Label>
      <div className="flex gap-1.5 sm:gap-2" dir="ltr">
        <CountryCodeSelect
          value={countryCode}
          onChange={onCountryChange}
          className="w-[100px] sm:w-[120px] flex-shrink-0 h-11 sm:h-11"
        />
        <Input
          id={id}
          type="tel"
          inputMode="tel"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onPhoneChange(e.target.value)}
          dir={dir || 'ltr'}
          className={`auth-touch-input flex-1 bg-background/50 transition-all duration-200 ${
            error ? 'border-rose-500 focus-visible:ring-rose-500' : ''
          }`}
        />
      </div>
      {error && (
        <div className="text-[10px] text-rose-500 flex items-center gap-1 animate-auth-slide-in">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  )
}

// Helper function for full phone normalization (client-side mirror of server).
// NOTE: This was previously named `useFullPhone` (a "hook") but it doesn't
// actually use any React hooks internally — it's a pure function. Calling it
// inside an event handler violated the Rules of Hooks. Renamed to a plain
// function. A backwards-compat alias is kept for any external callers.
export function formatFullPhone(countryCode: string, phone: string): string {
  return `${countryCode}${phone.replace(/[\s\-()]/g, '').replace(/^0+/, '')}`
}

// Backwards-compat alias (deprecated — use formatFullPhone instead)
export const useFullPhone = formatFullPhone

export { DEFAULT_COUNTRY }
