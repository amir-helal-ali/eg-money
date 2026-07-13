import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  isValidEmail, isValidUsername, normalizeUsername, isValidInternationalPhone,
  maskEmail, maskPhone,
} from '@/lib/validation'
import { issueOtp } from '@/lib/otp'

// Resolve identifier (username / email / phone) to a user.
async function findUserByIdentifier(identifier: string) {
  const trimmed = identifier.trim()
  if (!trimmed) return null

  if (isValidEmail(trimmed)) {
    return await db.user.findUnique({ where: { email: trimmed.toLowerCase() } })
  }
  if (trimmed.startsWith('+') && isValidInternationalPhone(trimmed)) {
    return await db.user.findFirst({ where: { phone: trimmed } })
  }
  if (isValidUsername(trimmed)) {
    const normalized = normalizeUsername(trimmed)
    return await db.user.findUnique({ where: { username: normalized } })
  }
  return null
}

// POST /api/auth/forgot-password
// Body: { identifier: string }
// Returns: { needsChannel: true, availableChannels: ['EMAIL','PHONE'] } when username is used
//          OR { otpSent: true, channel, masked } when channel chosen / identifier is email/phone directly
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { identifier, channel } = body as {
      identifier?: string
      channel?: 'EMAIL' | 'PHONE'
    }

    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json(
        { error: 'أدخل اسم المستخدم أو البريد أو الهاتف' },
        { status: 400 },
      )
    }

    const user = await findUserByIdentifier(identifier)

    // Always return generic success to avoid account enumeration
    // BUT: if username is used and user exists, we return available channels
    const trimmedLower = identifier.trim().toLowerCase()
    const isUsername =
      !isValidEmail(trimmedLower) &&
      !(trimmedLower.startsWith('+') && isValidInternationalPhone(trimmedLower)) &&
      isValidUsername(trimmedLower)

    if (!user) {
      // If user not found, return generic "if exists" message
      return NextResponse.json({
        otpSent: false,
        message: 'إذا كانت البيانات صحيحة، ستصلك تعليمات الاستعادة',
      })
    }

    // Determine available channels based on what user has
    const availableChannels: ('EMAIL' | 'PHONE')[] = []
    if (user.email) availableChannels.push('EMAIL')
    if (user.phone) availableChannels.push('PHONE')

    if (availableChannels.length === 0) {
      return NextResponse.json({
        otpSent: false,
        message: 'لا توجد طريقة استرجاع متاحة لهذا الحساب. تواصل مع الدعم',
      })
    }

    // If identifier is username, the client must select channel first
    if (isUsername && !channel) {
      return NextResponse.json({
        needsChannel: true,
        availableChannels,
        maskedEmail: user.email ? maskEmail(user.email) : null,
        maskedPhone: user.phone ? maskPhone(user.phone) : null,
      })
    }

    // Pick the channel
    let chosenChannel: 'EMAIL' | 'PHONE'
    if (channel && availableChannels.includes(channel)) {
      chosenChannel = channel
    } else if (isValidEmail(trimmedLower)) {
      chosenChannel = 'EMAIL'
    } else if (trimmedLower.startsWith('+') && isValidInternationalPhone(trimmedLower)) {
      chosenChannel = 'PHONE'
    } else {
      chosenChannel = availableChannels[0]
    }

    // Generate + store + dispatch OTP (uses crypto.randomInt, never logs in prod)
    await issueOtp(user.id, chosenChannel)

    const masked = chosenChannel === 'EMAIL' ? maskEmail(user.email!) : maskPhone(user.phone!)

    return NextResponse.json({
      otpSent: true,
      channel: chosenChannel,
      masked,
      message:
        chosenChannel === 'EMAIL'
          ? 'أرسلنا رمز التحقق إلى بريدك الإلكتروني'
          : 'أرسلنا رمز التحقق إلى هاتفك',
    })
  } catch (e) {
    console.error('Forgot password error:', e)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}
