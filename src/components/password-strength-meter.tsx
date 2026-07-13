'use client'

import { useLanguage } from '@/hooks/use-language'
import { Check, X } from 'lucide-react'

type Props = {
  password: string
}

// Local copy of password-strength logic (mirror of /lib/validation.ts)
function getStrength(pw: string) {
  const checks = {
    length: pw.length >= 8,
    lower: /[a-z]/.test(pw),
    upper: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  }
  const score = (Object.values(checks) as boolean[]).filter(Boolean).length
  const mapped = Math.max(0, Math.min(4, score - 1)) as 0 | 1 | 2 | 3 | 4
  return { score: mapped, checks }
}

export function PasswordStrengthMeter({ password }: Props) {
  const { t } = useLanguage()
  const { score, checks } = getStrength(password)

  const labels = [
    'auth.strengthWeak',
    'auth.strengthFair',
    'auth.strengthGood',
    'auth.strengthStrong',
    'auth.strengthVeryStrong',
  ] as const
  const colors = [
    'bg-rose-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-lime-500',
    'bg-emerald-500',
  ]
  const textColors = [
    'text-rose-500',
    'text-orange-500',
    'text-amber-500',
    'text-lime-500',
    'text-emerald-500',
  ]

  if (!password) return null

  const items: { ok: boolean; label: string }[] = [
    { ok: checks.length, label: t('auth.checkLength') },
    { ok: checks.upper, label: t('auth.checkUpper') },
    { ok: checks.lower, label: t('auth.checkLower') },
    { ok: checks.number, label: t('auth.checkNumber') },
    { ok: checks.symbol, label: t('auth.checkSymbol') },
  ]

  return (
    <div className="space-y-2 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex items-center gap-1.5">
        <div className="flex-1 grid grid-cols-5 gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-colors ${
                i <= score ? colors[score] : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <span className={`text-[10px] font-medium w-14 text-left ${textColors[score]}`}>
          {t(labels[score])}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[10px]">
            <div
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                it.ok ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
              }`}
            >
              {it.ok ? <Check className="w-2 h-2" /> : <X className="w-2 h-2" />}
            </div>
            <span className={it.ok ? 'text-foreground' : 'text-muted-foreground'}>{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
