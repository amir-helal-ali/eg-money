'use client'

import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

export type P2pEvent = {
  type: 'NEW_MESSAGE' | 'TRADE_PAID' | 'TRADE_RELEASED' | 'TRADE_CANCELLED' | 'DISPUTE_OPENED' | 'DISPUTE_RESOLVED' | 'OFFER_TAKEN'
  tradeId?: string
  offerId?: string
  senderId?: string
  senderName?: string
  messagePreview?: string
  usdtAmount?: number
  egpAmount?: number
  resolution?: string
  timestamp?: number
  [key: string]: any
}

type Handler = (event: P2pEvent) => void

// Module-level singleton socket — one connection shared across all hook
// instances. We piggyback on the same socket as balance updates + notifications.
let p2pSocket: Socket | null = null
let connectAttempts = 0
const handlers = new Map<string, Set<Handler>>() // event type → handlers

function ensureSocket() {
  if (p2pSocket) return p2pSocket
  if (typeof window === 'undefined') return null

  const isDev = process.env.NODE_ENV === 'development'
  const tickerUrl = isDev
    ? `${window.location.protocol}//${window.location.hostname}:3003`
    : undefined

  p2pSocket = io(tickerUrl, {
    transports: ['websocket', 'polling'],
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    timeout: 10000,
    query: { XTransformPort: '3003' },
  })

  p2pSocket.on('connect', () => {
    connectAttempts = 0
    // Authenticate with session token (same as balance socket)
    fetch('/api/notifications/ws-token', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.token) {
          p2pSocket?.emit('authenticate', { token: data.token })
        }
      })
      .catch(() => {})
  })

  // Dispatch incoming P2P events to all registered handlers
  p2pSocket.on('p2p:event', (event: P2pEvent) => {
    if (!event?.type) return
    const typeHandlers = handlers.get(event.type)
    if (typeHandlers) {
      typeHandlers.forEach((h) => {
        try {
          h(event)
        } catch (e) {
          console.error('[p2p-events] handler error:', e)
        }
      })
    }
    // Also dispatch to '*' wildcard handlers
    const wildcardHandlers = handlers.get('*')
    if (wildcardHandlers) {
      wildcardHandlers.forEach((h) => {
        try {
          h(event)
        } catch (e) {
          console.error('[p2p-events] wildcard handler error:', e)
        }
      })
    }
  })

  return p2pSocket
}

/**
 * Subscribe to real-time P2P events via WebSocket.
 *
 * Usage:
 *   useP2pEvents('NEW_MESSAGE', (event) => {
 *     // Refresh chat panel
 *   })
 *
 * Or subscribe to all event types:
 *   useP2pEvents('*', (event) => {
 *     console.log('P2P event:', event.type, event.tradeId)
 *   })
 *
 * The hook is a no-op on the server.
 */
export function useP2pEvents(eventType: P2pEvent['type'] | '*', handler: Handler) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    const socket = ensureSocket()
    if (!socket) return

    // Register this handler
    if (!handlers.has(eventType)) {
      handlers.set(eventType, new Set())
    }
    const stableHandler: Handler = (event) => handlerRef.current(event)
    handlers.get(eventType)!.add(stableHandler)

    return () => {
      handlers.get(eventType)?.delete(stableHandler)
    }
  }, [eventType])
}

/**
 * Convenience hook: subscribe to ALL P2P events with a single handler.
 */
export function useAllP2pEvents(handler: Handler) {
  useP2pEvents('*', handler)
}
