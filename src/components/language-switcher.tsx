'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Languages, Check } from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'
import { toast } from 'sonner'

export function LanguageSwitcher() {
  const { lang, changeLang, t } = useLanguage()

  const languages = [
    { code: 'ar' as const, flag: '🇪🇬', native: t('language.arabic'), label: 'Arabic' },
    { code: 'en' as const, flag: '🇬🇧', native: t('language.english'), label: 'English' },
  ]

  function handleChange(newLang: 'ar' | 'en') {
    changeLang(newLang)
    toast.success(newLang === 'en' ? 'Language switched to English' : 'تم التحويل للعربية')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          aria-label={t('language.label')}
        >
          <Languages className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 glass-strong border-border/50">
        <div className="px-2 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">
          {t('language.label')}
        </div>
        <DropdownMenuSeparator />
        {languages.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => handleChange(l.code)}
            className="flex items-center gap-2 cursor-pointer py-2"
          >
            <span className="text-base">{l.flag}</span>
            <div className="flex-1">
              <div className="text-sm font-medium">{l.native}</div>
              <div className="text-[10px] text-muted-foreground">{l.label}</div>
            </div>
            {lang === l.code && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
