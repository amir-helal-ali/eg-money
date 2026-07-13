'use client'

// Lightweight API client + auth store using Zustand
import { create } from 'zustand'
import { toast } from 'sonner'
import { io as socketIO } from 'socket.io-client'

export type User = {
  id: string
  email: string
  username?: string
  name: string | null
  phone: string | null
  countryCode?: string | null
  role: string
  egpBalance: number
  usdtBalance: number
  status: string
  referralCode?: string
  googleId?: string | null
  googleAvatar?: string | null
  emailVerified?: boolean
  phoneVerified?: boolean
}

export type Settings = {
  buyPriceEgp: number
  sellPriceEgp: number
  minTradeEgp: number
  maxTradeEgp: number
  minP2pEgp: number
  maxP2pEgp: number
  p2pFeePercent: number
  platformFeePercent: number
}

type AuthState = {
  user: User | null
  loading: boolean
  initialized: boolean
  settings: Settings | null
  fetchUser: () => Promise<void>
  fetchSettings: () => Promise<void>
  logout: () => Promise<void>
  setUser: (u: User | null) => void
  updateBalance: (egp: number, usdt: number) => void
}

// Singleton WebSocket for balance updates (separate from ticker/notif sockets)
let balanceSocket: any = null

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,
  settings: null,
  fetchUser: async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        set({ user: data.user, initialized: true })
        // Connect balance WS after login
        connectBalanceWS(data.user.id)
      } else {
        set({ user: null, initialized: true })
        disconnectBalanceWS()
      }
    } catch {
      set({ user: null, initialized: true })
    }
  },
  fetchSettings: async () => {
    try {
      const res = await fetch('/api/settings', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        set({ settings: data.settings })
      }
    } catch {}
  },
  logout: async () => {
    disconnectBalanceWS()
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    set({ user: null })
  },
  setUser: (u) => set({ user: u }),
  updateBalance: (egp, usdt) => {
    const current = get().user
    if (!current) return
    set({ user: { ...current, egpBalance: egp, usdtBalance: usdt } })
  },
}))

// Connect to WebSocket for real-time balance updates
function connectBalanceWS(_userId: string) {
  if (balanceSocket) return // already connected

  const isDev = process.env.NODE_ENV !== 'production'
  const tickerUrl = isDev
    ? `${window.location.protocol}//${window.location.hostname}:3003`
    : undefined

  balanceSocket = socketIO(tickerUrl, {
    transports: ['websocket', 'polling'],
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 3000,
    reconnectionDelayMax: 10000,
    timeout: 10000,
    query: { XTransformPort: '3003' },
  })

  balanceSocket.on('connect', () => {
    // Authenticate with session token
    fetch('/api/notifications/ws-token', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.token) {
          balanceSocket.emit('authenticate', { token: data.token })
        }
      })
      .catch(() => {})
  })

  // Listen for real-time balance updates
  balanceSocket.on('balance:update', (data: { egpBalance: number; usdtBalance: number }) => {
    useAuth.getState().updateBalance(data.egpBalance, data.usdtBalance)
  })

  // Silently handle connection errors (ticker-service may not be running yet)
  balanceSocket.on('connect_error', () => {})
  balanceSocket.on('reconnect_failed', () => {
    // After 10 failed attempts, stop trying silently
    if (balanceSocket) {
      balanceSocket.disconnect()
      balanceSocket = null
    }
  })

  balanceSocket.on('disconnect', () => {})
}

function disconnectBalanceWS() {
  if (balanceSocket) {
    balanceSocket.disconnect()
    balanceSocket = null
  }
}

export async function apiCall<T = any>(
  url: string,
  options: RequestInit = {},
): Promise<{ data?: T; error?: string; status: number }> {
  try {
    const res = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { error: data.error || 'حدث خطأ غير متوقع', status: res.status }
    }
    return { data, status: res.status }
  } catch (e: any) {
    return { error: e?.message || 'فشل الاتصال بالخادم', status: 0 }
  }
}

export function showError(error?: string) {
  if (error) toast.error(error)
}

export function showSuccess(msg: string) {
  toast.success(msg)
}

// Format helpers (client-side) — ALWAYS English/Latin numerals
export function fmtEgp(n: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0)
}
export function fmtUsdt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(n || 0)
}

export const PAYMENT_METHODS: { value: string; label: string; icon: string }[] = [
  { value: 'VODAFONE_CASH', label: 'فودافون كاش', icon: '📱' },
  { value: 'INSTAPAY', label: 'إنستا باي', icon: '⚡' },
  { value: 'FAWRY', label: 'فوري', icon: '🏪' },
  { value: 'BANK_TRANSFER', label: 'تحويل بنكي', icon: '🏦' },
]

export function methodLabel(value: string): string {
  return PAYMENT_METHODS.find((m) => m.value === value)?.label || value
}
export function methodIcon(value: string): string {
  return PAYMENT_METHODS.find((m) => m.value === value)?.icon || '💳'
}
