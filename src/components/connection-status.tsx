'use client'

import { useEffect, useRef, useState } from 'react'
import { useTicker, ConnectionState } from '@/hooks/use-ticker'
import { useLanguage } from '@/hooks/use-language'
import { Wifi, WifiOff, RefreshCw, Loader2 } from 'lucide-react'

const STATE_CONFIG: Record<ConnectionState, {
  color: string
  bg: string
  label: string
  icon: any
  pulse: boolean
  spin: boolean
}> = {
  connected: {
    color: 'text-success',
    bg: 'bg-success/10',
    label: 'en' === (typeof document !== 'undefined' ? document.documentElement.lang : 'ar') ? 'Connected' : 'متصل',
    icon: Wifi,
    pulse: false,
    spin: false,
  },
  connecting: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    label: 'en' === (typeof document !== 'undefined' ? document.documentElement.lang : 'ar') ? 'Connecting' : 'جارٍ الاتصال',
    icon: Loader2,
    pulse: false,
    spin: true,
  },
  reconnecting: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    label: 'en' === (typeof document !== 'undefined' ? document.documentElement.lang : 'ar') ? 'Reconnecting' : 'إعادة الاتصال',
    icon: RefreshCw,
    pulse: true,
    spin: true,
  },
  disconnected: {
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    label: 'en' === (typeof document !== 'undefined' ? document.documentElement.lang : 'ar') ? 'Offline' : 'غير متصل',
    icon: WifiOff,
    pulse: true,
    spin: false,
  },
}

type Variant = 'dot' | 'badge' | 'full'

export function ConnectionStatus({ variant = 'dot' }: { variant?: Variant }) {
  const { connectionState, reconnectAttempt } = useTicker()
  const config = STATE_CONFIG[connectionState]
  const Icon = config.icon

  if (variant === 'dot') {
    return (
      <div className="relative flex items-center" title={config.label}>
        <span className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')} ${config.pulse ? 'animate-pulse' : ''}`} />
        {connectionState === 'reconnecting' && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] font-num text-amber-400 whitespace-nowrap">
            {reconnectAttempt}
          </span>
        )}
      </div>
    )
  }

  if (variant === 'badge') {
    return (
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${config.bg} ${config.color} text-[10px] font-medium`}>
        <Icon className={`w-3 h-3 ${config.spin ? 'animate-spin' : ''}`} />
        <span>{config.label}</span>
        {connectionState === 'reconnecting' && reconnectAttempt > 0 && (
          <span className="font-num opacity-70">({reconnectAttempt})</span>
        )}
      </div>
    )
  }

  // full variant
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bg} ${config.color} text-xs font-medium`}>
      <Icon className={`w-3.5 h-3.5 ${config.spin ? 'animate-spin' : ''} ${config.pulse ? 'animate-pulse' : ''}`} />
      <span>{config.label}</span>
      {connectionState === 'reconnecting' && reconnectAttempt > 0 && (
        <span className="font-num opacity-70">محاولة {reconnectAttempt}</span>
      )}
    </div>
  )
}

/**
 * Global connection banner that appears when the connection drops.
 * Shows at the top of the page when disconnected or reconnecting.
 * Auto-dismisses when connection is restored.
 */
export function ConnectionBanner() {
  const { connectionState } = useTicker()
  const { t } = useLanguage()
  const [showBanner, setShowBanner] = useState(false)
  const wasConnectedRef = useRef(false)

  useEffect(() => {
    if (connectionState === 'connected') {
      wasConnectedRef.current = true
      // Keep banner visible briefly to show "restored" then hide
      if (showBanner) {
        const t = setTimeout(() => setShowBanner(false), 2000)
        return () => clearTimeout(t)
      }
    } else if (connectionState === 'reconnecting' || connectionState === 'disconnected') {
      // Only show banner if we were previously connected (don't show on initial load)
      if (wasConnectedRef.current) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShowBanner(true)
      }
    }
  }, [connectionState, showBanner])

  if (!showBanner) return null

  const isReconnecting = connectionState === 'reconnecting'
  const config = STATE_CONFIG[connectionState]
  const Icon = config.icon

  return (
    <div
      className="fixed top-14 sm:top-16 inset-x-0 z-[60] px-4"
      style={{ animation: 'slideDown 0.3s ease-out' }}
    >
      <div className={`mx-auto max-w-md flex items-center justify-center gap-2 px-4 py-2 rounded-b-xl glass-strong border-x border-b border-border/50 ${config.color} text-xs font-medium shadow-lg`}>
        <Icon className={`w-4 h-4 ${config.spin ? 'animate-spin' : ''} ${config.pulse ? 'animate-pulse' : ''}`} />
        <span>
          {isReconnecting
            ? t('connection.reconnectingMsg')
            : connectionState === 'connected'
              ? t('connection.restored')
              : t('connection.lostMsg')}
        </span>
      </div>
      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
