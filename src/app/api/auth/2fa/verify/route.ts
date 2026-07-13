import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'
import { verifyTotp, generateBackupCodes, hashBackupCode } from '@/lib/totp'
import { safeJsonParse } from '@/lib/safe-json'

/**
 * POST /api/auth/2fa/verify
 *
 * Confirms 2FA setup by verifying a 6-digit TOTP code from the user's
 * authenticator app. On success:
 *   - Enables 2FA (totpEnabled = true)
 *   - Generates 8 single-use backup codes (returned ONCE — user must save them)
 *
 * Body: { code: string }
 *
 * SECURITY:
 *   - Code verified with ±1 time window tolerance (clock drift)
 *   - Constant-time comparison
 *   - Backup codes hashed with SHA-256 + pepper before storage
 *   - Backup codes returned as plaintext ONLY in this response (never again)
 */
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch the stored secret
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { totpSecret: true, totpEnabled: true },
  })
  if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!dbUser.totpSecret) {
    return NextResponse.json(
      { error: 'لم يبدأ إعداد 2FA. استدعِ /api/auth/2fa/setup أولاً.' },
      { status: 400 },
    )
  }
  if (dbUser.totpEnabled) {
    return NextResponse.json({ error: '2FA مُفعّل بالفعل' }, { status: 400 })
  }

  const body = await req.json()
  const { code } = body as { code?: string }

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'الرمز مطلوب' }, { status: 400 })
  }

  // Verify the code
  if (!verifyTotp(code.trim(), dbUser.totpSecret)) {
    return NextResponse.json({ error: 'رمز غير صحيح' }, { status: 400 })
  }

  // Success — enable 2FA + generate backup codes
  const backupCodes = generateBackupCodes()
  const hashedBackupCodes = backupCodes.map(hashBackupCode)

  await db.user.update({
    where: { id: user.id },
    data: {
      totpEnabled: true,
      totpBackupCodes: JSON.stringify(hashedBackupCodes),
    },
  })

  return NextResponse.json({
    success: true,
    enabled: true,
    backupCodes, // plaintext — ONLY returned here, user must save them
    message: 'تم تفعيل 2FA. احفظ أكواد النسخ الاحتياطي في مكان آمن — لن تظهر مرة أخرى.',
  })
}

/**
 * GET /api/auth/2fa/verify
 * Returns the current 2FA status (enabled/disabled) for the user.
 * Does NOT return the secret or backup codes.
 */
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { totpEnabled: true, totpSecret: true, totpBackupCodes: true },
  })
  if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const backupCodesRemaining = safeJsonParse<string[]>(dbUser.totpBackupCodes, []).length

  return NextResponse.json({
    enabled: dbUser.totpEnabled,
    hasSecret: !!dbUser.totpSecret,
    backupCodesRemaining,
  })
}
