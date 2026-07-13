import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'
import { hashPassword, verifyPassword } from '@/lib/auth'
import { isStrongPassword } from '@/lib/validation'
import { createNotification } from '@/lib/notifications'
import { sendEmail, EMAIL_TEMPLATES } from '@/lib/email'

// POST /api/auth/change-password
// Body: { currentPassword: string, newPassword: string }
// For logged-in users who want to change their password
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'كلمة المرور الحالية والجديدة مطلوبتان' }, { status: 400 })
    }

    // Fetch the user with password hash
    const dbUser = await db.user.findUnique({ where: { id: user.id } })
    if (!dbUser || !dbUser.passwordHash) {
      return NextResponse.json({ error: 'هذا الحساب لا يستخدم كلمة مرور' }, { status: 400 })
    }

    // Verify current password
    if (!verifyPassword(currentPassword, dbUser.passwordHash)) {
      return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 })
    }

    // Validate new password strength
    if (!isStrongPassword(newPassword)) {
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' },
          { status: 400 },
        )
      }
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تحتوي على أحرف كبيرة وصغيرة وأرقام ورموز' },
        { status: 400 },
      )
    }

    // Hash and update
    const newHash = hashPassword(newPassword)
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    })

    // Security notification
    await createNotification({
      userId: user.id,
      type: 'SECURITY',
      title: '🔐 تم تغيير كلمة المرور',
      message: `تم تغيير كلمة مرور حسابك في ${new Date().toLocaleString('ar-EG')}. إذا لم تكن أنت، تواصل مع الدعم فوراً.`,
      metadata: { action: 'SECURITY_PASSWORD_CHANGED' },
    })

    // Send email alert
    sendEmail(user.id, 'security', EMAIL_TEMPLATES.passwordChanged()).catch(() => {})

    // Do NOT invalidate all sessions — user is currently logged in and should stay
    // They changed their own password, not a reset

    return NextResponse.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح',
    })
  } catch (e) {
    console.error('Change password error:', e)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}
