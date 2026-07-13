'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'
import { apiCall, useAuth } from '@/lib/client'
import { toast } from 'sonner'

type Props = {
  mode: 'signin' | 'signup'
  disabled?: boolean
  className?: string
}

// Google "G" logo (official multi-color)
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  )
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          renderButton: (parent: HTMLElement, options: any) => void
          prompt: () => void
          cancel: () => void
          disableAutoSelect: () => void
        }
      }
    }
  }
}

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client'
let scriptPromise: Promise<void> | null = null

function loadGisScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.google?.accounts?.id) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SCRIPT_URL}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load GIS')))
      return
    }
    const s = document.createElement('script')
    s.src = GIS_SCRIPT_URL
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load GIS'))
    document.head.appendChild(s)
  })
  return scriptPromise
}

export function GoogleSignInButton({ mode, disabled, className }: Props) {
  const { t, lang } = useLanguage()
  const { fetchUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [clientId, setClientId] = useState<string | null>(null)
  const [gisReady, setGisReady] = useState(false)

  // Fetch Google OAuth config from API
  useEffect(() => {
    fetch('/api/auth/google')
      .then((r) => r.json())
      .then((data) => {
        setEnabled(!!data.enabled)
        setClientId(data.clientId || null)
      })
      .catch(() => {})
  }, [])

  // Initialize GIS (just initialize, don't render native button)
  useEffect(() => {
    if (!enabled || !clientId) return

    let cancelled = false
    loadGisScript()
      .then(() => {
        if (cancelled || !window.google) return
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredential,
          auto_select: false,
          cancel_on_tap_outside: true,
        })
        setGisReady(true)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, clientId])

  function handleClick() {
    if (!gisReady || !window.google) {
      toast.error(t('auth.googleError'))
      return
    }
    // Trigger the GIS prompt which shows the account chooser
    window.google.accounts.id.prompt()
  }

  async function handleCredential(response: any) {
    setLoading(true)
    const { data, error } = await apiCall<{ user?: any }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential: response.credential }),
    })
    setLoading(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success(t('auth.googleLoginSuccess'))
    await fetchUser()
  }

  // If Google is disabled, render nothing
  if (!enabled) return null

  const label = mode === 'signin' ? t('auth.googleSignIn') : t('auth.googleSignUp')

  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={disabled || loading || !gisReady}
        className="w-full gap-2.5 h-11 sm:h-12 bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400 font-medium text-xs sm:text-sm transition-all duration-200 auth-btn-shine"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <GoogleIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px] flex-shrink-0" />
        )}
        <span className="truncate">{label}</span>
      </Button>
    </div>
  )
}

// Standalone Google icon button — used in places where the GIS button can't be rendered
export function GoogleIconButton({
  onClick,
  loading,
  label,
}: {
  onClick: () => void
  loading?: boolean
  label: string
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={loading}
      className="w-full gap-2 h-11 bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
      {label}
    </Button>
  )
}
