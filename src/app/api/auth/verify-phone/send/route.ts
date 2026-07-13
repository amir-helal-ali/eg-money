import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/session'
import { issueOtp, notifyAdminsOfOtpRequest } from '@/lib/otp'

// POST /api/auth/verify-phone/send
// Sends a 6-digit OTP via SMS to the user's phone for verification
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!user.phone) {
      return NextResponse.json({ error: 'لا يوجد رقم هاتف مسجل' }, { status: 400 })
    }

    if (user.phoneVerified) {
      return NextResponse.json({ error: 'رقم الهاتف مؤكد بالفعل' }, { status: 400 })
    }

    // Generate + store + dispatch OTP (no admin sees the code)
    const { otp } = await issueOtp(user.id, 'PHONE')

    // Notify admins that a verification was requested (WITHOUT the OTP)
    await notifyAdminsOfOtpRequest(user.id, 'PHONE', user.name || user.email)

    return NextResponse.json({
      success: true,
      message: 'تم إرسال رمز التحقق إلى هاتفك',
      maskedPhone: user.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3'),
      ...(process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {}),
    })
  } catch (e) {
    console.error('Verify phone send error:', e)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}
