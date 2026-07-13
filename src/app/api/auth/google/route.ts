import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession } from '@/lib/auth'
import { generateReferralCode, isValidEmail } from '@/lib/validation'

// POST /api/auth/google
// Body: { credential: string }  ← Google ID token from GIS
// Verifies the ID token via Google's tokeninfo endpoint, then:
//   - If a user with this googleId exists → log them in
//   - Else if a user with this email exists (with password) → reject (must link from settings)
//   - Else → create a new user via Google
export async function POST(req: NextRequest) {
  try {
    // Check admin-enabled Google OAuth
    const settings = await db.settings.findFirst()
    if (!settings?.googleOAuthEnabled || !settings?.googleClientId) {
      return NextResponse.json(
        { error: 'تسجيل الدخول عبر جوجل غير مفعل حالياً' },
        { status: 403 },
      )
    }

    const body = await req.json()
    const { credential } = body as { credential?: string }
    if (!credential || typeof credential !== 'string') {
      return NextResponse.json(
        { error: 'بيانات اعتماد جوجل مفقودة' },
        { status: 400 },
      )
    }

    // Verify the ID token using Google's tokeninfo endpoint (no extra deps)
    // In production, prefer using google-auth-library's OAuth2Client.verifyIdToken
    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
      { method: 'GET' },
    )
    if (!verifyRes.ok) {
      return NextResponse.json(
        { error: 'فشل التحقق من رمز جوجل' },
        { status: 401 },
      )
    }
    const payload = (await verifyRes.json()) as {
      sub?: string
      email?: string
      email_verified?: string | boolean
      name?: string
      picture?: string
      aud?: string
    }

    if (!payload.sub || !payload.email) {
      return NextResponse.json(
        { error: 'بيانات اعتماد جوجل غير مكتملة' },
        { status: 400 },
      )
    }

    // Verify audience matches our client ID
    if (payload.aud !== settings.googleClientId) {
      return NextResponse.json(
        { error: 'بيانات اعتماد جوجل غير صالحة' },
        { status: 401 },
      )
    }

    if (!isValidEmail(payload.email)) {
      return NextResponse.json(
        { error: 'بريد جوجل غير صالح' },
        { status: 400 },
      )
    }

    const emailLower = payload.email.toLowerCase()

    // 1) Existing Google-linked user → log in
    let user = await db.user.findUnique({ where: { googleId: payload.sub } })
    if (user) {
      // Update Google profile data
      user = await db.user.update({
        where: { id: user.id },
        data: {
          googleEmail: emailLower,
          googleName: payload.name || user.googleName,
          googleAvatar: payload.picture || user.googleAvatar,
          lastLoginAt: new Date(),
        },
      })
    } else {
      // 2) Existing user with same email BUT no googleId → reject
      const existingByEmail = await db.user.findUnique({ where: { email: emailLower } })
      if (existingByEmail && !existingByEmail.googleId) {
        return NextResponse.json(
          {
            error:
              'هذا البريد مسجل بكلمة مرور. سجّل الدخول أولاً ثم اربط جوجل من الإعدادات',
            code: 'EMAIL_EXISTS_WITH_PASSWORD',
          },
          { status: 409 },
        )
      }

      // 3) Create a new user via Google
      // Username: derived from email prefix, ensure uniqueness
      let baseUsername = emailLower.split('@')[0].replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 15)
      if (!baseUsername || baseUsername.length < 3) baseUsername = 'user'
      let username = baseUsername
      let suffix = 1
      while (await db.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${suffix++}`.slice(0, 20)
      }

      // Phone must be unique — we don't have one from Google, leave null
      // But our schema requires `phone` unique only when not null, so null is fine.
      // Username unique. Referral code unique.
      let newReferralCode = generateReferralCode(username)
      for (let i = 0; i < 5; i++) {
        const clash = await db.user.findUnique({ where: { referralCode: newReferralCode } })
        if (!clash) break
        newReferralCode = generateReferralCode(username)
      }

      user = await db.user.create({
        data: {
          email: emailLower,
          username,
          name: payload.name || username,
          passwordHash: null, // Google-only user
          role: 'USER',
          referralCode: newReferralCode,
          googleId: payload.sub,
          googleEmail: emailLower,
          googleName: payload.name || null,
          googleAvatar: payload.picture || null,
          emailVerified: payload.email_verified === 'true' || payload.email_verified === true,
          phoneVerified: false,
        },
      })

      await db.userSettings.create({ data: { userId: user.id } })

      // Welcome notification
      await db.notification.create({
        data: {
          userId: user.id,
          type: 'SYSTEM',
          title: 'مرحباً بك في Eg-Money! 🎉',
          message: 'تم إنشاء حسابك عبر جوجل بنجاح. أكمل ملفك الشخصي برقم الهاتف لتفعيل كل الخدمات.',
        },
      })
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'هذا الحساب موقوف. تواصل مع الإدارة' },
        { status: 403 },
      )
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
        googleId: user.googleId,
        googleAvatar: user.googleAvatar,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
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
    console.error('Google auth error:', e)
    return NextResponse.json({ error: 'فشل تسجيل الدخول عبر جوجل' }, { status: 500 })
  }
}

// GET /api/auth/google — returns whether Google OAuth is enabled + client ID (public)
export async function GET() {
  const settings = await db.settings.findFirst()
  return NextResponse.json({
    enabled: !!settings?.googleOAuthEnabled,
    clientId: settings?.googleClientId || null,
  })
}
