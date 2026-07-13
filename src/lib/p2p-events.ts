/**
 * Push a real-time P2P event to a user via WebSocket.
 *
 * Call this after P2P state changes so the user's open browser tabs update
 * instantly (no polling required):
 *   - New chat message received
 *   - Trade paid by counterparty
 *   - Trade released by seller
 *   - Trade cancelled
 *   - Dispute opened or resolved
 *   - Offer taken by another user
 *
 * The frontend listens for these via the useP2pEvents hook and refreshes
 * the relevant UI (chat panel, trade cards, my-offers list).
 */

export type P2pEventType =
  | 'NEW_MESSAGE'
  | 'TRADE_PAID'
  | 'TRADE_RELEASED'
  | 'TRADE_CANCELLED'
  | 'DISPUTE_OPENED'
  | 'DISPUTE_RESOLVED'
  | 'OFFER_TAKEN'

export type P2pEvent = {
  type: P2pEventType
  tradeId?: string
  /** Optional message sender info for NEW_MESSAGE */
  senderName?: string
  /** Optional message preview for NEW_MESSAGE */
  messagePreview?: string
  /** Optional timestamp (defaults to now) */
  timestamp?: number
  /** Optional extra metadata */
  [key: string]: any
}

import { tickerPost } from '@/lib/ticker-client'

/**
 * Push a P2P event to one user. Non-blocking, fails silently.
 */
export async function pushP2pEvent(userId: string, event: P2pEvent) {
  // Uses internal secret + timeout via tickerPost helper
  await tickerPost('/p2p-event', {
    userId,
    event: { timestamp: Date.now(), ...event },
  })
}

/**
 * Push the same P2P event to multiple users (e.g., both buyer and seller).
 */
export async function pushP2pEvents(userIds: string[], event: P2pEvent) {
  for (const userId of userIds) {
    await pushP2pEvent(userId, event)
  }
}
