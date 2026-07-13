// Service Worker for Eg-Money push notifications
// Allows notifications to appear even when the tab is closed

// ===== Push event — show notification =====
self.addEventListener('push', (event) => {
  let data = { title: 'Eg-Money', body: 'إشعار جديد' }
  try {
    if (event.data) {
      data = event.data.json()
    }
  } catch {
    data = { title: 'Eg-Money', body: event.data?.text() || 'إشعار جديد' }
  }

  const options = {
    body: data.body,
    icon: '/brand/favicon-64.png',
    badge: '/brand/favicon-32.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    requireInteraction: true, // notification stays until user dismisses
    tag: data.tag || 'eg-money-notification',
    renotify: true,
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// ===== Notification click — focus or open the app =====
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})

// ===== Fetch event — passthrough to network =====
// Without this handler, the SW intercepts fetch requests but can't respond
// when the dev server is temporarily down (recompiling), causing
// "Failed to convert value to 'Response'" errors.
// This handler simply passes all requests through to the network.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request))
})

// ===== Activate event — clean up old SW versions =====
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
