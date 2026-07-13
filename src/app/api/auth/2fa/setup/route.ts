import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'
import { generateTotpSecret, buildOtpAuthUrl, computeTotp } from '@/lib/totp'

/**
 * POST /api/auth/2fa/setup
 *
 * Initiates 2FA setup: generates a new TOTP secret, stores it (NOT yet enabled),
 * and returns the secret + otpauth:// URL for QR code generation.
 *
 * The user must then:
 *   1. Scan the QR code with their authenticator app
 *   2. Verify a 6-digit code via /api/auth/2fa/verify to confirm + enable 2FA
 *
 * If the user already has 2FA enabled, this returns an error (they must
 * disable it first via /api/auth/2fa/disable).
 *
 * SECURITY: The secret is stored on the user record but `totpEnabled` stays
 * false until verification. This means if the user abandons setup midway,
 * the secret is inert.
 */
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (user.totpEnabled) {
    return NextResponse.json(
      { error: '2FA مُفعّل بالفعل. عطّله أولاً لإعادة الإعداد.' },
      { status: 400 },
    )
  }

  // Generate a new secret (replaces any previous unverified secret)
  const secret = generateTotpSecret()
  const issuer = 'Eg-Money'
  const accountName = user.email
  const otpAuthUrl = buildOtpAuthUrl(issuer, accountName, secret)

  // Store the secret (NOT enabled yet — user must verify first)
  await db.user.update({
    where: { id: user.id },
    data: { totpSecret: secret, totpEnabled: false },
  })

  // Generate a preview code so the user can verify their app is set up correctly
  // before calling /verify (helps debug clock skew issues)
  const previewCode = computeTotp(secret)

  return NextResponse.json({
    secret,
    otpAuthUrl,
    issuer,
    accountName,
    previewCode, // shown for 30s so user can confirm their app matches
    message: 'امسح QR code بتطبيق المصادقة، ثم تحقق برمز 6 أرقام.',
  })
}
