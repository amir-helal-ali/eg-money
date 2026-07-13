import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createSession } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'
import {
  normalizeUsername, normalizePhone,
  isValidInternationalPhone, generateReferralCode,
} from '@/lib/validation'
import { SignupSchema, parseBody } from '@/lib/schemas'
import { t } from '@/lib/i18n'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // ===== Zod schema validation (centralized in src/lib/schemas.ts) =====
    const parsed = parseBody(SignupSchema, body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error, field: 'form' },
        { status: 400 },
      )
    }
    const { email, password, username, phone, countryCode, referralCode } = parsed.data

    const emailLower = email.toLowerCase().trim()
    const normalizedUsername = normalizeUsername(username)

    // Phone normalization + validation (zod checks presence; we check format here)
    const fullPhone = normalizePhone(countryCode, phone)
    if (!isValidInternationalPhone(fullPhone)) {
      return NextResponse.json(
        { error: 'رقم هاتف غير صحيح', field: 'phone' },
        { status: 400 },
      )
    }

    // Uniqueness checks
    const existingEmail = await db.user.findUnique({ where: { email: emailLower } })
    if (existingEmail) {
      return NextResponse.json(
        { error: t('EMAIL_EXISTS'), field: 'email' },
        { status: 409 },
      )
    }
    const existingUsername = await db.user.findUnique({ where: { username: normalizedUsername } })
    if (existingUsername) {
      return NextResponse.json(
        { error: t('USERNAME_EXISTS'), field: 'username' },
        { status: 409 },
      )
    }
    // Phone is nullable in schema — use findFirst to handle null uniquely
    if (fullPhone) {
      const existingPhone = await db.user.findFirst({ where: { phone: fullPhone } })
      if (existingPhone) {
        return NextResponse.json(
          { error: t('PHONE_EXISTS'), field: 'phone' },
          { status: 409 },
        )
      }
    }

    // Referral code validation
    let referrerId: string | null = null
    if (referralCode && typeof referralCode === 'string') {
      const code = referralCode.trim().toUpperCase()
      if (code) {
        const referrer = await db.user.findUnique({ where: { referralCode: code } })
        if (!referrer) {
          return NextResponse.json(
            { error: 'كود الإحالة غير صحيح', field: 'referralCode' },
            { status: 400 },
          )
        }
        referrerId = referrer.id
      }
    }

    // Generate unique referral code for the new user
    let newReferralCode = generateReferralCode(normalizedUsername)
    for (let i = 0; i < 5; i++) {
      const clash = await db.user.findUnique({ where: { referralCode: newReferralCode } })
      if (!clash) break
      newReferralCode = generateReferralCode(normalizedUsername)
    }

    const passwordHash = hashPassword(password)
    const user = await db.user.create({
      data: {
        email: emailLower,
        username: normalizedUsername,
        name: normalizedUsername,
        phone: fullPhone,
        countryCode,
        passwordHash,
        referralCode: newReferralCode,
        referredById: referrerId,
        emailVerified: false,
        phoneVerified: false,
      },
    })

    await db.userSettings.create({ data: { userId: user.id } })

    // Record referral relationship if applicable
    if (referrerId) {
      await db.referral.create({
        data: {
          referrerId,
          referredId: user.id,
          code: newReferralCode,
          status: 'PENDING',
          rewardEgp: 0,
        },
      })
      await db.notification.create({
        data: {
          userId: referrerId,
          type: 'PROMO',
          title: 'دعوة ناجحة!',
          message: `تم تسجيل شخص جديد باستخدام كود الإحالة الخاص بك (${newReferralCode}).`,
        },
      })
    }

    // Welcome notification
    await createNotification({
      userId: user.id,
      type: 'SYSTEM',
      title: 'مرحباً بك في Eg-Money! 🎉',
      message:
        'تم إنشاء حسابك بنجاح. ابدأ بإيداع رصيد ثم تداول USDT مباشرة أو في سوق P2P.',
      metadata: { action: 'view_dashboard' },
    })

    // Notify admins about new user signup
    const admins = await db.user.findMany({ where: { role: 'ADMIN', status: 'ACTIVE' } })
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'SYSTEM',
        title: '👤 مستخدم جديد',
        message: `سجّل مستخدم جديد: ${normalizedUsername} (${emailLower})${fullPhone ? ` — ${fullPhone}` : ''}`,
        metadata: { newUserId: user.id, username: normalizedUsername, action: 'admin_users' },
      })
    }

    const token = await createSession(
      user.id,
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
      req.headers.get('user-agent') || null,
    )

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        phone: user.phone,
        countryCode: user.countryCode,
        role: user.role,
        egpBalance: Number(user.egpBalance),
        usdtBalance: Number(user.usdtBalance),
        status: user.status,
        referralCode: user.referralCode,
      },
      token,
    })

    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (e) {
    console.error('Signup error:', e)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}
