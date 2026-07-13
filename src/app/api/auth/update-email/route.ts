import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'
import { isValidEmail } from '@/lib/validation'

// POST /api/auth/update-email
// Body: { email: string }
// Allows unverified users to change their email before verification
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Only allow if email is not yet verified
    if (user.emailVerified) {
      return NextResponse.json({ error: 'لا يمكن تغيير بريد مؤكد' }, { status: 400 })
    }

    const body = await req.json()
    const { email } = body as { email?: string }

    if (!email || !isValidEmail(email.trim())) {
      return NextResponse.json({ error: 'صيغة البريد الإلكتروني غير صحيحة' }, { status: 400 })
    }

    const emailLower = email.trim().toLowerCase()

    // Check if email is taken by another user
    const existing = await db.user.findUnique({ where: { email: emailLower } })
    if (existing && existing.id !== user.id) {
      return NextResponse.json({ error: 'هذا البريد مسجل لمستخدم آخر' }, { status: 409 })
    }

    await db.user.update({
      where: { id: user.id },
      data: { email: emailLower },
    })

    return NextResponse.json({
      success: true,
      message: 'تم تحديث البريد الإلكتروني',
      email: emailLower,
    })
  } catch (e) {
    console.error('Update email error:', e)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}
