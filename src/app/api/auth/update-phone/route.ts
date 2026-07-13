import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'
import { isValidInternationalPhone, normalizePhone } from '@/lib/validation'
import { issueOtp, notifyAdminsOfOtpRequest } from '@/lib/otp'

// POST /api/auth/update-phone
// Body: { phone: string, countryCode: string }
// For Google users who don't have a phone number — set it + start verification
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { phone, countryCode } = body

    if (!phone || !countryCode) {
      return NextResponse.json({ error: 'رقم الهاتف ورمز الدولة مطلوبان' }, { status: 400 })
    }

    const fullPhone = normalizePhone(countryCode, phone)
    if (!isValidInternationalPhone(fullPhone)) {
      return NextResponse.json({ error: 'رقم هاتف غير صحيح' }, { status: 400 })
    }

    // Check if phone is already taken
    const existing = await db.user.findFirst({ where: { phone: fullPhone, NOT: { id: user.id } } })
    if (existing) {
      return NextResponse.json({ error: 'رقم الهاتف مسجل لمستخدم آخر' }, { status: 409 })
    }

    // Update user's phone
    await db.user.update({
      where: { id: user.id },
      data: { phone: fullPhone, countryCode, phoneVerified: false },
    })

    // Generate + store + dispatch OTP (no admin sees the code)
    const { otp } = await issueOtp(user.id, 'PHONE')

    // Notify admins (WITHOUT the OTP)
    await notifyAdminsOfOtpRequest(user.id, 'PHONE', user.name || user.email)

    return NextResponse.json({
      success: true,
      message: 'تم تحديث رقم الهاتف. أدخل رمز التحقق.',
      phone: fullPhone,
      maskedPhone: fullPhone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3'),
      ...(process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {}),
    })
  } catch (e) {
    console.error('Update phone error:', e)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}
