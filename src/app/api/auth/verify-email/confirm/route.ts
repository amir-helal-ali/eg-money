import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'
import { createNotification } from '@/lib/notifications'

const MAX_OTP_ATTEMPTS = 5

/**
 * POST /api/auth/verify-email/confirm
 * Body: { otp: string }
 * Verifies the OTP and marks email as verified.
 *
 * SECURITY: Tracks failed attempts in `user.otpAttempts`. After MAX_OTP_ATTEMPTS
 * (5) wrong guesses, the OTP is invalidated and the user must request a new one.
 * Uses constant-time OTP comparison to prevent timing attacks.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { otp } = body as { otp?: string }

    if (!otp) {
      return NextResponse.json({ error: 'الرمز مطلوب' }, { status: 400 })
    }

    const dbUser = await db.user.findUnique({ where: { id: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // ===== Attempt limit check =====
    if ((dbUser.otpAttempts ?? 0) >= MAX_OTP_ATTEMPTS) {
      await db.user.update({
        where: { id: user.id },
        data: {
          otpCode: null,
          otpChannel: null,
          otpExpires: null,
          otpAttempts: 0,
        },
      })
      return NextResponse.json(
        { error: 'تجاوزت عدد المحاولات. اطلب رمزاً جديداً.' },
        { status: 400 },
      )
    }

    // ===== OTP validation (constant-time comparison) =====
    const suppliedOtp = String(otp).trim()
    const expectedOtp = dbUser.otpCode ? String(dbUser.otpCode) : ''
    const otpMatches =
      expectedOtp.length > 0 &&
      suppliedOtp.length === expectedOtp.length &&
      timingSafeStringEqual(suppliedOtp, expectedOtp)

    if (!otpMatches || dbUser.otpChannel !== 'EMAIL') {
      // Increment attempt counter
      await db.user.update({
        where: { id: user.id },
        data: { otpAttempts: { increment: 1 } },
      })
      return NextResponse.json({ error: 'الرمز غير صحيح' }, { status: 400 })
    }

    if (!dbUser.otpExpires || dbUser.otpExpires.getTime() < Date.now()) {
      return NextResponse.json({ error: 'الرمز منتهي الصلاحية' }, { status: 400 })
    }

    // ===== Success: mark email verified + clear OTP + reset attempts =====
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        otpCode: null,
        otpChannel: null,
        otpExpires: null,
        otpAttempts: 0,
      },
    })

    // Security notification
    await createNotification({
      userId: user.id,
      type: 'SECURITY',
      title: '✅ تم تأكيد البريد الإلكتروني',
      message: `تم تأكيد بريدك الإلكتروني ${user.email} بنجاح في ${new Date().toLocaleString('ar-EG')}.`,
      metadata: { action: 'SECURITY_EMAIL_VERIFIED' },
    })

    // Check if phone also needs verification
    const updatedUser = await db.user.findUnique({ where: { id: user.id } })
    const phoneNeedsVerification = updatedUser?.phone && !updatedUser.phoneVerified

    return NextResponse.json({
      success: true,
      message: 'تم تأكيد البريد الإلكتروني بنجاح',
      emailVerified: true,
      phoneVerified: updatedUser?.phoneVerified || false,
      phoneNeedsVerification,
      phone: updatedUser?.phone,
    })
  } catch (e) {
    console.error('Verify email confirm error:', e)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}

/** Constant-time string comparison (avoids timing-based character guessing). */
function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}
