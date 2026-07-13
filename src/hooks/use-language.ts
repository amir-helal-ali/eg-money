'use client'

import { useState, useEffect, useCallback } from 'react'
import { type Lang, t as translate } from '@/lib/translations'

const STORAGE_KEY = 'eg-money-lang'

/**
 * Language hook.
 * - Reads/writes language preference to localStorage
 * - Updates html lang and dir attributes
 * - Provides `t(path)` function for translations
 * - Triggers re-render across all components using the hook when language changes
 */
export function useLanguage() {
  const [lang, setLang] = useState<Lang>('ar')

  const updateHtmlAttrs = (l: Lang) => {
    const html = document.documentElement
    html.lang = l
    html.dir = l === 'ar' ? 'rtl' : 'ltr'
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null
      if (saved === 'ar' || saved === 'en') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLang(saved)
        updateHtmlAttrs(saved)
      }
    } catch {}
  }, [])

  const changeLang = useCallback((newLang: Lang) => {
    setLang(newLang)
    try { localStorage.setItem(STORAGE_KEY, newLang) } catch {}
    updateHtmlAttrs(newLang)
    // Dispatch a custom event so all components using useLanguage re-render
    window.dispatchEvent(new CustomEvent('language-change', { detail: newLang }))
  }, [])

  // Listen for language change events (from other components)
  useEffect(() => {
    const handler = (e: Event) => {
      const newLang = (e as CustomEvent).detail as Lang
      setLang(newLang)
    }
    window.addEventListener('language-change', handler)
    return () => window.removeEventListener('language-change', handler)
  }, [])

  // Translation function
  const t = useCallback((path: string): string => {
    return translate(lang, path)
  }, [lang])

  return { lang, changeLang, t }
}
