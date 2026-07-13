import { db } from '@/lib/db'
import { pushP2pEvents } from '@/lib/p2p-events'

/**
 * Posts an auto-generated SYSTEM message to a P2P trade's chat.
 * System messages mark lifecycle events (created, paid, released, etc.)
 * and are visually rendered as centered gray pills in the chat UI.
 *
 * They are also pushed via WebSocket so all parties refresh instantly.
 */
export async function postSystemMessage(
  tradeId: string,
  message: string,
  metadata?: {
    buyerId?: string
    sellerId?: string
    event?: string
  },
) {
  try {
    // Find a system user — we use the first admin as the sender for system
    // messages. The senderRole field distinguishes these from regular user
    // messages, so the UI knows to render them differently.
    const admin = await db.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
    })

    // If no admin exists, use a placeholder senderId (the buyer)
    // The senderRole='SYSTEM' flag is what matters for rendering.
    let senderId = admin?.id
    if (!senderId) {
      const trade = await db.p2pTrade.findUnique({
        where: { id: tradeId },
        select: { buyerId: true },
      })
      senderId = trade?.buyerId || 'system'
    }

    const msg = await db.p2pMessage.create({
      data: {
        tradeId,
        senderId,
        message,
        senderRole: 'SYSTEM',
        isSystem: true,
        // System messages are auto-read by everyone
        readByBuyer: true,
        readBySeller: true,
        readByAdmin: true,
        readAt: new Date(),
      },
    })

    // Push real-time event to all parties so chat refreshes
    const recipientIds = [metadata?.buyerId, metadata?.sellerId].filter(Boolean) as string[]
    if (recipientIds.length > 0) {
      await pushP2pEvents(recipientIds, {
        type: 'NEW_MESSAGE',
        tradeId,
        senderId: msg.senderId,
        senderName: 'System',
        messagePreview: message,
        isSystem: true,
      })
    }

    return msg
  } catch (e) {
    console.error('[postSystemMessage] error:', e)
    return null
  }
}

/** Standard system messages for the P2P trade lifecycle. */
export const SYSTEM_MESSAGES = {
  tradeCreated: (usdtAmount: number, egpAmount: number, priceEgp: number) =>
    `📋 تم إنشاء الصفقة — ${usdtAmount} USDT @ ${priceEgp} EGP (إجمالي ${egpAmount} جنيه)`,
  buyerMarkedPaid: (egpAmount: number, method: string) =>
    `💰 أكد المشتري دفع ${egpAmount} جنيه عبر ${method} — بانتظار إفراج البائع`,
  sellerReleased: (usdtAmount: number) =>
    `✅ أفرج البائع عن ${usdtAmount} USDT — تم إيداعها في محفظة المشتري. الصفقة مكتملة`,
  tradeCancelled: (reason?: string) =>
    `❌ تم إلغاء الصفقة${reason ? ` — ${reason}` : ''}. تم استرجاع الأموال للطرفين`,
  disputeOpened: (reason: string, openerRole: string) =>
    `⚠️ تم فتح نزاع بواسطة ${openerRole} — السبب: ${reason}. الإدارة ستراجع الأمر`,
  disputeUnderReview: (adminName: string) =>
    `🔍 الإدارة (${adminName}) تراجع النزاع الآن`,
  disputeResolved: (resolution: string, adminName: string) =>
    `⚖️ تم حل النزاع بواسطة ${adminName} — ${resolution}`,
  adminJoined: (adminName: string) =>
    `🛡️ انضم ${adminName} (إدارة) للمحادثة`,
  paymentTimeoutWarning: (minutesLeft: number) =>
    `⏰ تحذير: تبقى ${minutesLeft} دقيقة على انتهاء مهلة الدفع`,
} as const
