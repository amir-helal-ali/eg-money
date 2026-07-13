import { db } from '@/lib/db'
import { tickerPost } from '@/lib/ticker-client'
import { safeJsonParse } from '@/lib/safe-json'

export type NotificationType =
  | 'PRICE'
  | 'TRADE'
  | 'SECURITY'
  | 'SYSTEM'
  | 'PROMO'
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'P2P'

type CreateNotificationInput = {
  userId: string
  type: NotificationType
  title: string
  message: string
  metadata?: Record<string, any>
}

/**
 * Create a notification in the database + push it to the user via WebSocket.
 * The WebSocket push goes through the ticker-service's HTTP /notify endpoint.
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  metadata,
}: CreateNotificationInput) {
  try {
    const notification = await db.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })

    // Build the notification payload for the client
    const payload = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      metadata: safeJsonParse(notification.metadata, null),
      createdAt: notification.createdAt,
    }

    // Push to ticker-service via HTTP (it will broadcast via WebSocket to the user's sockets)
    // Fire-and-forget — don't block the response
    // Uses internal secret + timeout via tickerPost helper
    tickerPost('/notify', { userId, notification: payload })

    return notification
  } catch (e) {
    console.error('[notifications] Failed to create notification:', e)
    return null
  }
}

/**
 * Create notifications for multiple users (e.g., admin broadcasts).
 */
export async function createNotifications(
  inputs: CreateNotificationInput[]
) {
  try {
    await db.notification.createMany({
      data: inputs.map(i => ({
        userId: i.userId,
        type: i.type,
        title: i.title,
        message: i.message,
        metadata: i.metadata ? JSON.stringify(i.metadata) : null,
      })),
    })
  } catch (e) {
    console.error('[notifications] Failed to create notifications:', e)
  }
}
