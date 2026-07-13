import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, destroyAllUserSessions } from '@/lib/auth'
import { isStrongPassword } from '@/lib/validation'
import { createNotification } from '@/lib/notifications'

// POST /api/auth/reset-password
// Body: { token: string, password: string }
// Token is the OTP-verified reset token issued by /api/auth/verify-otp
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, password } = body as { token?: string; password?: string }

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'رمز الاستعادة غير صالح' },
        { status: 400 },
      )
    }
    if (!password) {
      return NextResponse.json(
        { error: 'كلمة المرور مطلوبة' },
        { status: 400 },
      )
    }

    // Strengthened password rules
    if (!isStrongPassword(password)) {
      if (password.length < 8) {
        return NextResponse.json(
          { error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' },
          { status: 400 },
        )
      }
      return NextResponse.json(
        {
          error: 'كلمة المرور يجب أن تحتوي على أحرف كبيرة وصغيرة وأرقام ورموز',
        },
        { status: 400 },
      )
    }

    const user = await db.user.findFirst({
      where: { resetToken: token },
    })

    if (
      !user ||
      !user.resetExpires ||
      user.resetExpires.getTime() < Date.now()
    ) {
      return NextResponse.json(
        { error: 'رمز الاستعادة غير صالح أو منتهي' },
        { status: 400 },
      )
    }

    const passwordHash = hashPassword(password)
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetExpires: null,
      },
    })

    // Invalidate all existing sessions (force re-login)
    await destroyAllUserSessions(user.id)

    // Security notification: password was reset
    await createNotification({
      userId: user.id,
      type: 'SECURITY',
      title: '🔐 تم تغيير كلمة المرور',
      message: `تم تغيير كلمة مرور حسابك في ${new Date().toLocaleString('ar-EG')}. إذا لم تكن أنت، تواصل مع الدعم فوراً.`,
      metadata: { action: 'SECURITY_RESET', timestamp: new Date().toISOString() },
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      message: 'تم تحديث كلمة المرور، يمكنك تسجيل الدخول الآن',
    })
  } catch (e) {
    console.error('Reset password error:', e)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}
