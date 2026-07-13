import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'
import { createNotification } from '@/lib/notifications'
import { pushP2pEvents } from '@/lib/p2p-events'
import { requireVerified } from '@/lib/verify-guard'

// GET /api/p2p/messages?tradeId=xxx — get all messages for a trade
// Supports admin access: admins can read messages on disputed trades
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const tradeId = url.searchParams.get('tradeId')
  if (!tradeId) return NextResponse.json({ error: 'tradeId required' }, { status: 400 })

  // Verify user is part of this trade OR is an admin (admins can read on disputes)
  const trade = await db.p2pTrade.findUnique({ where: { id: tradeId } })
  if (!trade) return NextResponse.json({ error: 'Trade not found' }, { status: 404 })

  const isBuyer = trade.buyerId === user.id
  const isSeller = trade.sellerId === user.id
  const isAdmin = user.role === 'ADMIN'

  if (!isBuyer && !isSeller && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  // Admins can only read messages on DISPUTED trades
  if (isAdmin && !isBuyer && !isSeller && trade.status !== 'DISPUTED') {
    return NextResponse.json({ error: 'Admins can access chat only for disputed trades' }, { status: 403 })
  }

  // Auto-mark all messages as read by the current user (when they fetch)
  if (isBuyer) {
    await db.p2pMessage.updateMany({
      where: { tradeId, readByBuyer: false, isSystem: false },
      data: { readByBuyer: true, readAt: new Date() },
    })
  } else if (isSeller) {
    await db.p2pMessage.updateMany({
      where: { tradeId, readBySeller: false, isSystem: false },
      data: { readBySeller: true, readAt: new Date() },
    })
  } else if (isAdmin) {
    await db.p2pMessage.updateMany({
      where: { tradeId, readByAdmin: false },
      data: { readByAdmin: true },
    })
  }

  const messages = await db.p2pMessage.findMany({
    where: { tradeId },
    orderBy: { createdAt: 'asc' },
    take: 500,
    include: {
      sender: {
        select: { id: true, name: true, username: true, role: true },
      },
    },
  })

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.sender?.name || m.sender?.username || 'مستخدم',
      senderRole: m.senderRole, // USER | ADMIN | SYSTEM
      senderUserRole: m.sender?.role, // USER | ADMIN
      message: m.isDeleted ? '(تم حذف الرسالة)' : m.message,
      originalMessage: m.isDeleted ? null : m.message,
      attachmentUrl: m.isDeleted ? null : m.attachmentUrl,
      isSystem: m.isSystem,
      isEdited: m.isEdited,
      isDeleted: m.isDeleted,
      editedAt: m.editedAt,
      isMine: m.senderId === user.id && !m.isSystem,
      // Read receipts (from the perspective of the OTHER party)
      readByOther:
        isBuyer ? m.readBySeller
        : isSeller ? m.readByBuyer
        : true, // admin sees everything as read
      readAt: m.readAt,
      createdAt: m.createdAt,
    })),
    myRole: isBuyer ? 'BUYER' : isSeller ? 'SELLER' : 'ADMIN',
  })
}

// POST /api/p2p/messages — send a message
// Body: { tradeId, message, attachmentUrl? }
// Admins can post as ADMIN role on disputed trades
export async function POST(req: NextRequest) {
  // P2P messaging requires verified email/phone (if admin enforces it)
  const verifyError = await requireVerified(req)
  if (verifyError) return verifyError

  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { tradeId, message, attachmentUrl } = body

  if (!tradeId || !message || !message.trim()) {
    return NextResponse.json({ error: 'tradeId and message required' }, { status: 400 })
  }

  const trade = await db.p2pTrade.findUnique({ where: { id: tradeId } })
  if (!trade) return NextResponse.json({ error: 'Trade not found' }, { status: 404 })

  const isBuyer = trade.buyerId === user.id
  const isSeller = trade.sellerId === user.id
  const isAdmin = user.role === 'ADMIN'

  if (!isBuyer && !isSeller && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  // Admins can only post on DISPUTED trades
  if (isAdmin && !isBuyer && !isSeller && trade.status !== 'DISPUTED') {
    return NextResponse.json({ error: 'Admins can post only on disputed trades' }, { status: 403 })
  }
  if (trade.status === 'CANCELLED' || trade.status === 'RELEASED') {
    return NextResponse.json({ error: 'الصفقة منتهية' }, { status: 400 })
  }

  const trimmed = message.trim().slice(0, 1000) // max 1000 chars

  const msg = await db.p2pMessage.create({
    data: {
      tradeId,
      senderId: user.id,
      message: trimmed,
      attachmentUrl: attachmentUrl || null,
      senderRole: isAdmin ? 'ADMIN' : 'USER',
      isSystem: false,
      // Sender has read their own message
      readByBuyer: isBuyer || isAdmin,
      readBySeller: isSeller || isAdmin,
      readByAdmin: isAdmin,
      readAt: new Date(),
    },
  })

  // Determine recipients (the other party + admins if disputed)
  const recipientIds: string[] = []
  if (isBuyer) recipientIds.push(trade.sellerId)
  if (isSeller) recipientIds.push(trade.buyerId)
  if (isAdmin) {
    recipientIds.push(trade.buyerId)
    recipientIds.push(trade.sellerId)
  }
  // If trade is disputed, notify all admins too
  if (trade.status === 'DISPUTED' && !isAdmin) {
    const admins = await db.user.findMany({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      select: { id: true },
    })
    recipientIds.push(...admins.map((a) => a.id))
  }
  const uniqueRecipients = Array.from(new Set(recipientIds)).filter((id) => id !== user.id)

  // Push real-time event so recipients' chat panel refreshes instantly
  await pushP2pEvents(uniqueRecipients, {
    type: 'NEW_MESSAGE',
    tradeId,
    senderId: user.id,
    senderName: user.name || user.username,
    senderRole: isAdmin ? 'ADMIN' : 'USER',
    messagePreview: trimmed.slice(0, 100),
  })

  // Send notification to recipients
  for (const recipientId of uniqueRecipients) {
    await createNotification({
      userId: recipientId,
      type: 'P2P',
      title: isAdmin ? '🛡️ رسالة من الإدارة' : '💬 رسالة جديدة في صفقة P2P',
      message: `${isAdmin ? 'الإدارة' : user.name || user.username}: ${trimmed.slice(0, 80)}`,
      metadata: { tradeId, action: 'view_p2p' },
    })
  }

  return NextResponse.json({
    message: {
      id: msg.id,
      senderId: msg.senderId,
      senderName: user.name || user.username,
      senderRole: msg.senderRole,
      message: msg.message,
      attachmentUrl: msg.attachmentUrl,
      isSystem: false,
      isEdited: false,
      isDeleted: false,
      isMine: true,
      readByOther: false,
      createdAt: msg.createdAt,
    },
  })
}

// PATCH /api/p2p/messages — edit or delete own message (5-min window for edits)
// Body: { messageId, action: 'EDIT' | 'DELETE', text? }
export async function PATCH(req: NextRequest) {
  // Editing/deleting messages also requires verification
  const verifyError = await requireVerified(req)
  if (verifyError) return verifyError

  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { messageId, action, text } = body
  if (!messageId || !action) {
    return NextResponse.json({ error: 'messageId and action required' }, { status: 400 })
  }
  if (action !== 'EDIT' && action !== 'DELETE') {
    return NextResponse.json({ error: 'action must be EDIT or DELETE' }, { status: 400 })
  }

  const msg = await db.p2pMessage.findUnique({ where: { id: messageId } })
  if (!msg) return NextResponse.json({ error: 'الرسالة غير موجودة' }, { status: 404 })
  if (msg.senderId !== user.id) {
    return NextResponse.json({ error: 'غير مصرح — يمكنك تعديل رسائلك فقط' }, { status: 403 })
  }
  if (msg.isSystem) {
    return NextResponse.json({ error: 'لا يمكن تعديل رسائل النظام' }, { status: 400 })
  }
  if (msg.isDeleted) {
    return NextResponse.json({ error: 'الرسالة محذوفة بالفعل' }, { status: 400 })
  }

  // 5-minute edit/delete window
  const ageMs = Date.now() - new Date(msg.createdAt).getTime()
  const fiveMinMs = 5 * 60 * 1000
  if (ageMs > fiveMinMs) {
    return NextResponse.json(
      { error: 'انتهت مهلة التعديل (5 دقائق من الإرسال)' },
      { status: 400 },
    )
  }

  if (action === 'DELETE') {
    await db.p2pMessage.update({
      where: { id: messageId },
      data: { isDeleted: true, deletedAt: new Date() },
    })
    return NextResponse.json({ success: true, message: 'تم حذف الرسالة' })
  }

  // EDIT
  if (!text || !text.trim()) {
    return NextResponse.json({ error: 'text required for edit' }, { status: 400 })
  }
  const newText = text.trim().slice(0, 1000)
  const updated = await db.p2pMessage.update({
    where: { id: messageId },
    data: { message: newText, isEdited: true, editedAt: new Date() },
  })

  return NextResponse.json({
    success: true,
    message: {
      id: updated.id,
      message: updated.message,
      isEdited: true,
      editedAt: updated.editedAt,
    },
  })
}
