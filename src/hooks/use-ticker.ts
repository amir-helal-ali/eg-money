'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export type TickerData = {
  buyPriceEgp: number
  sellPriceEgp: number
  askPriceEgp: number
  bidPriceEgp: number
  spread: number
  change24h: number
  change24hAbs: number
  open24h: number
  volume24h: number
  high24h: number
  low24h: number
  activeOffers: number
  onlineUsers: number
  tradesToday: number
  usdtTraded: number
  successRate: number
  timestamp: number
  source: 'live' | 'fallback'
  history: { t: number; p: number }[]
}

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

export function useTicker() {
  const [data, setData] = useState<TickerData | null>(null)
  const [connected, setConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting')
  const [reconnectAttempt, setReconnectAttempt] = useState(0)
  const socketRef = useRef<Socket | null>(null)
  const prevPriceRef = useRef<number>(0)
  const [direction, setDirection] = useState<'up' | 'down' | 'flat'>('flat')

  useEffect(() => {
    // In dev, connect directly to the ticker-service on port 3003.
    // In production (behind Caddy on port 81), the XTransformPort query param
    // routes the WebSocket through the reverse proxy.
    const isDev = process.env.NODE_ENV !== 'production'
    const tickerUrl = isDev
      ? `${window.location.protocol}//${window.location.hostname}:3003`
      : undefined // same origin; Caddy will route via XTransformPort

    const socket = io(tickerUrl, {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 10000,
      timeout: 10000,
      query: { XTransformPort: '3003' },
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      setConnectionState('connected')
      setReconnectAttempt(0)
    })

    socket.on('disconnect', (reason) => {
      setConnected(false)
      // If the server disconnected (not the client), try to reconnect
      if (reason === 'io server disconnect') {
        setConnectionState('disconnected')
      } else {
        setConnectionState('reconnecting')
      }
    })

    socket.on('connect_error', () => {
      setConnected(false)
      setConnectionState('reconnecting')
    })

    socket.io.on('reconnect_attempt', (attempt) => {
      setConnectionState('reconnecting')
      setReconnectAttempt(attempt)
    })

    socket.io.on('reconnect_failed', () => {
      setConnectionState('disconnected')
    })

    socket.io.on('reconnect', () => {
      setConnected(true)
      setConnectionState('connected')
      setReconnectAttempt(0)
    })

    socket.on('ticker', (newData: TickerData) => {
      setData(newData)
      if (prevPriceRef.current) {
        if (newData.buyPriceEgp > prevPriceRef.current) setDirection('up')
        else if (newData.buyPriceEgp < prevPriceRef.current) setDirection('down')
        else setDirection('flat')
      }
      prevPriceRef.current = newData.buyPriceEgp
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  return { data, connected, connectionState, reconnectAttempt, direction }
}
