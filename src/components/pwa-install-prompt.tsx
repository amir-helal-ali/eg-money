'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X, Smartphone } from 'lucide-react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSAL_KEY = 'pwa-install-dismissed'
const DISMISSAL_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * PWA Install Prompt — shows a banner prompting the user to install the app
 * when the browser fires the `beforeinstallprompt` event.
 *
 * Dismissals are remembered for 7 days (localStorage).
 * The banner only appears on the 2nd visit (session count) to avoid
 * pestering first-time visitors.
 */
export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Check if previously dismissed
    try {
      const dismissed = localStorage.getItem(DISMISSAL_KEY)
      if (dismissed) {
        const dismissedAt = parseInt(dismissed, 10)
        if (Date.now() - dismissedAt < DISMISSAL_DURATION) {
          return // still within dismissal window
        }
      }
    } catch {}

    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    // Check session count — only show on 2nd+ visit
    try {
      const count = parseInt(sessionStorage.getItem('visit-count') || '0', 10) + 1
      sessionStorage.setItem('visit-count', String(count))
      if (count < 2) return
    } catch {}

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Delay showing by 3 seconds so it doesn't interrupt the initial load
      setTimeout(() => setShow(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setShow(false)
    }
    setDeferredPrompt(null)
  }

  function handleDismiss() {
    setShow(false)
    try {
      localStorage.setItem(DISMISSAL_KEY, String(Date.now()))
    } catch {}
  }

  if (!show) return null

  return (
    <div className="fixed bottom-20 md:bottom-4 inset-x-4 md:right-4 md:inset-x-auto z-50 max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div className="glass-strong rounded-2xl border border-primary/30 shadow-xl p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">ثبّت Eg-Money على جوالك</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              وصول أسرع، إشعارات فورية، وتجربة بملء الشاشة — بدون متصفح.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <Button onClick={handleInstall} className="w-full gap-2" size="sm">
          <Download className="w-4 h-4" />
          تثبيت التطبيق
        </Button>
      </div>
    </div>
  )
}
