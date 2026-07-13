import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/session'
import { issueOtp, notifyAdminsOfOtpRequest } from '@/lib/otp'

// POST /api/auth/verify-email/send
// Sends a 6-digit OTP to the user's email for verification
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (user.emailVerified) {
      return NextResponse.json({ error: 'البريد الإلكتروني مؤكد بالفعل' }, { status: 400 })
    }

    // Generate + store + dispatch OTP (no admin sees the code)
    const { otp } = await issueOtp(user.id, 'EMAIL')

    // Notify admins that a verification was requested (WITHOUT the OTP)
    await notifyAdminsOfOtpRequest(user.id, 'EMAIL', user.name || user.email)

    return NextResponse.json({
      success: true,
      message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
      // In dev, return the OTP so the UI can display it for testing
      ...(process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {}),
    })
  } catch (e) {
    console.error('Verify email send error:', e)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}
