import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'

// Mark a single notification as read
export async function PATCH(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { notificationId } = body

  if (!notificationId) {
    return NextResponse.json({ error: 'معرف الإشعار مطلوب' }, { status: 400 })
  }

  const notification = await db.notification.findUnique({
    where: { id: notificationId },
  })

  if (!notification) {
    return NextResponse.json({ error: 'الإشعار غير موجود' }, { status: 404 })
  }

  if (notification.userId !== user.id) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  await db.notification.update({
    where: { id: notificationId },
    data: { read: true },
  })

  return NextResponse.json({ success: true })
}
