import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { generateReferralCode } from '@/lib/validation'

// One-time seed endpoint to create admin user & initial settings.
// SECURITY: This endpoint requires a bootstrap token in the request body
// that must match the BOOTSTRAP_ADMIN_TOKEN environment variable.
// Without this, any unauthenticated user could create an admin account.
//
// Recommended: Use `npm run reset-admin` (scripts/reset-admin.ts) instead,
// which runs locally as a CLI script and doesn't expose an HTTP endpoint.
export async function POST(req: NextRequest) {
  try {
    // ===== Bootstrap token check =====
    const bootstrapToken = process.env.BOOTSTRAP_ADMIN_TOKEN
    if (!bootstrapToken || bootstrapToken.length < 32) {
      return NextResponse.json(
        {
          error:
            'تأمين غير مُهيّأ: حدد BOOTSTRAP_ADMIN_TOKEN (32 حرفاً على الأقل) في ملف .env. أو استخدم `npm run reset-admin` محلياً.',
        },
        { status: 503 },
      )
    }

    const body = await req.json()
    const { email, password, username, name, phone, countryCode, bootstrapToken: supplied } = body

    if (supplied !== bootstrapToken) {
      // Constant-time comparison to avoid timing attacks
      const suppliedBuf = Buffer.from(String(supplied || ''))
      const expectedBuf = Buffer.from(bootstrapToken)
      if (suppliedBuf.length !== expectedBuf.length || !timingSafeEqual(suppliedBuf, expectedBuf)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // If an admin already exists, refuse to seed again
    const existingAdmin = await db.user.findFirst({ where: { role: 'ADMIN' } })
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'يوجد أدمن بالفعل', adminEmail: existingAdmin.email },
        { status: 400 },
      )
    }

    if (!email || !password || !username) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور واسم المستخدم مطلوبة' },
        { status: 400 },
      )
    }

    const emailLower = String(email).toLowerCase().trim()
    const usernameLower = String(username).toLowerCase().trim()
    const passwordHash = hashPassword(password)

    let referralCode = generateReferralCode(usernameLower)
    for (let i = 0; i < 5; i++) {
      const clash = await db.user.findUnique({ where: { referralCode } })
      if (!clash) break
      referralCode = generateReferralCode(usernameLower)
    }

    // Admin always gets a verified phone by default. If the seeder didn't
    // supply one, fall back to a placeholder Egyptian number so the admin can
    // access all verified-only routes immediately.
    const adminCountryCode = countryCode || '+20'
    const adminPhone =
      phone && phone.length > 0
        ? `${adminCountryCode}${phone.replace(/^0+/, '')}`
        : '+201000000000'

    const admin = await db.user.create({
      data: {
        email: emailLower,
        username: usernameLower,
        name: name || 'Admin',
        phone: adminPhone,
        countryCode: adminCountryCode,
        passwordHash,
        role: 'ADMIN',
        egpBalance: 1000000,
        usdtBalance: 5000,
        referralCode,
        emailVerified: true,
        phoneVerified: true,
      },
    })

    await db.userSettings.create({ data: { userId: admin.id } })
    await db.settings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' },
    })

    return NextResponse.json({
      admin: {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        name: admin.name,
      },
      message: 'تم إنشاء حساب الأدمن بنجاح',
    })
  } catch (e) {
    console.error('Seed error:', e)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

// Constant-time buffer comparison (avoids timing attacks)
function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i]
  }
  return diff === 0
}
