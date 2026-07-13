'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Browser Push Notifications hook.
 * Uses the Notification Web API to show native OS-level notifications.
 *
 * Features:
 * - Request permission on mount (if not already granted/denied)
 * - Show notifications with title + body
 * - Auto-click notification focuses the window
 * - Persists permission preference in localStorage
 */

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const enabledRef = useRef(true)

  useEffect(() => {
    // Check if browser supports notifications
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return
    }

    // Load current permission
     
    setPermission(Notification.permission)

    // Load user preference
    try {
      const saved = localStorage.getItem('eg-money-push')
      if (saved !== null) enabledRef.current = saved === 'true'
    } catch {}

    // Register Service Worker for background notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied'
    }
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    } catch {
      return 'denied'
    }
  }, [])

  const notify = useCallback(
    (title: string, body?: string, options?: NotificationOptions) => {
      if (!enabledRef.current) return
      if (typeof window === 'undefined' || !('Notification' in window)) return
      if (Notification.permission !== 'granted') return

      // Use Service Worker for notifications (works even when tab is not focused)
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'eg-money-notification',
            requireInteraction: false,
            // `vibrate` is not in the TS lib's NotificationOptions type but
            // is supported by Android Chrome service worker notifications.
            ...({ vibrate: [200, 100, 200] } as object),
            ...options,
          })
        }).catch(() => {
          // Fallback to regular notification
          showRegularNotification(title, body, options)
        })
      } else {
        showRegularNotification(title, body, options)
      }
    },
    [],
  )

  // Fallback: regular Notification API (only works when tab is open)
  function showRegularNotification(title: string, body?: string, options?: NotificationOptions) {
    try {
      const notification = new Notification(title, {
        body,
        icon: '/brand/favicon-64.png',
        badge: '/brand/favicon-32.png',
        tag: 'eg-money-notification',
        ...options,
      })
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
      setTimeout(() => { try { notification.close() } catch {} }, 5000)
    } catch {}
  }

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled
    try { localStorage.setItem('eg-money-push', String(enabled)) } catch {}
    // If enabling, request permission
    if (enabled && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        requestPermission()
      }
    }
  }, [requestPermission])

  const isEnabled = useCallback(() => enabledRef.current, [])

  return {
    notify,
    requestPermission,
    permission,
    setEnabled,
    isEnabled,
    isSupported: typeof window !== 'undefined' && 'Notification' in window,
  }
}
