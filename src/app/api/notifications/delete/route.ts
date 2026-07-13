import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'

// DELETE /api/notifications/delete — delete a single notification
// Body: { notificationId: string }
// Or: { deleteAll: true } — delete all read notifications for this user
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const notificationId = url.searchParams.get('id')

  if (notificationId) {
    // Delete a single notification
    const notification = await db.notification.findUnique({
      where: { id: notificationId },
    })
    if (!notification) {
      return NextResponse.json({ error: 'الإشعار غير موجود' }, { status: 404 })
    }
    if (notification.userId !== user.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }
    await db.notification.delete({ where: { id: notificationId } })
    return NextResponse.json({ success: true })
  }

  // Delete all read notifications (cleanup)
  const result = await db.notification.deleteMany({
    where: { userId: user.id, read: true },
  })
  return NextResponse.json({ success: true, deleted: result.count })
}
