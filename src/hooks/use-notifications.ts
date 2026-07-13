'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

export type Notification = {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  metadata: Record<string, any> | null
  createdAt: string
}

/**
 * WebSocket-based notifications hook.
 * - Connects to the same WebSocket as the ticker (port 3003)
 * - Authenticates with the session_token cookie
 * - Receives new notifications in real-time (no polling!)
 * - Falls back to HTTP fetch if WebSocket is not available
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [connected, setConnected] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const fetchedRef = useRef(false)

  // Fetch notifications via HTTP as initial load / fallback
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=20', { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch {}
  }, [])

  useEffect(() => {
    // Connect to the ticker-service WebSocket (port 3003 in dev)
    const isDev = process.env.NODE_ENV !== 'production'
    const tickerUrl = isDev
      ? `${window.location.protocol}//${window.location.hostname}:3003`
      : undefined
    const socket = io(tickerUrl, {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)

      // Fetch the WebSocket auth token from the server (cookie is httpOnly)
      fetch('/api/notifications/ws-token', { credentials: 'include' })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.token) {
            socket.emit('authenticate', { token: data.token })
          }
        })
        .catch(() => {})
    })

    socket.on('disconnect', () => setConnected(false))
    socket.on('connect_error', () => setConnected(false))

    socket.on('authenticated', () => {
      setAuthenticated(true)
      // Fetch initial notifications via HTTP (the socket handler also sends them,
      // but we fetch here too as a reliable fallback)
      if (!fetchedRef.current) {
        fetchedRef.current = true
        fetchNotifications()
      }
    })

    socket.on('auth_error', () => {
      setAuthenticated(false)
    })

    // Receive initial notifications list
    socket.on('notifications', (data: { notifications: Notification[]; unreadCount: number }) => {
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    })

    // Receive a new notification in real-time
    socket.on('notification:new', (notification: Notification) => {
      setNotifications(prev => {
        // Avoid duplicates
        if (prev.some(n => n.id === notification.id)) return prev
        return [notification, ...prev].slice(0, 50)
      })
      setUnreadCount(prev => prev + 1)
    })

    return () => {
      socket.disconnect()
    }
  }, [fetchNotifications])

  // Mark a single notification as read (via HTTP) + return its action link if any
  const markRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
    try {
      await fetch('/api/notifications/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
        credentials: 'include',
      })
    } catch {}
  }, [])

  // Mark all as read (via HTTP)
  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        credentials: 'include',
      })
    } catch {}
  }, [])

  // Delete a single notification
  const deleteNotification = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    try {
      await fetch(`/api/notifications/delete?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
    } catch {}
  }, [])

  // Delete all read notifications (cleanup)
  const deleteAllRead = useCallback(async () => {
    setNotifications(prev => prev.filter(n => !n.read))
    try {
      await fetch('/api/notifications/delete', {
        method: 'DELETE',
        credentials: 'include',
      })
    } catch {}
  }, [])

  // Handle notification click: mark read + navigate to action page if metadata.action exists
  const handleNotificationClick = useCallback((notification: Notification) => {
    if (!notification.read) {
      markRead(notification.id)
    }
    // Return the action route so the UI can navigate
    const action = notification.metadata?.action
    if (!action) return null

    // Map action to tab/route
    const actionMap: Record<string, string> = {
      'view_wallet': 'wallet',
      'view_dashboard': 'dashboard',
      'view_trade': 'trade',
      'view_p2p': 'p2p',
      'admin_deposits': 'admin',
      'admin_withdrawals': 'admin',
      'admin_users': 'admin',
      'admin_p2p': 'admin',
    }
    return actionMap[action] || null
  }, [markRead])

  return {
    notifications,
    unreadCount,
    connected,
    authenticated,
    markRead,
    markAllRead,
    deleteNotification,
    deleteAllRead,
    handleNotificationClick,
    fetchNotifications,
  }
}
