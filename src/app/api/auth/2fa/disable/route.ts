import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'
import { verifyTotp, verifyBackupCode } from '@/lib/totp'
import { safeJsonParse } from '@/lib/safe-json'

/**
 * POST /api/auth/2fa/disable
 *
 * Disables 2FA. Requires either:
 *   - A valid TOTP code (proves the user still has their authenticator), OR
 *   - A valid backup code (proves the user has recovery codes)
 *
 * This prevents an attacker who stole the session from disabling 2FA without
 * also having compromised the second factor.
 *
 * Body: { code: string, useBackupCode?: boolean }
 */
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { totpSecret: true, totpEnabled: true, totpBackupCodes: true },
  })
  if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!dbUser.totpEnabled) {
    return NextResponse.json({ error: '2FA غير مُفعّل' }, { status: 400 })
  }

  const body = await req.json()
  const { code, useBackupCode } = body as { code?: string; useBackupCode?: boolean }

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'الرمز مطلوب' }, { status: 400 })
  }

  let authorized = false

  if (useBackupCode) {
    // Verify against backup codes
    const hashedCodes = safeJsonParse<string[]>(dbUser.totpBackupCodes, [])
    const matchIdx = verifyBackupCode(code, hashedCodes)
    if (matchIdx >= 0) {
      // Remove the used backup code (single-use)
      const _remaining = hashedCodes.filter((_, i) => i !== matchIdx)
      await db.user.update({
        where: { id: user.id },
        data: {
          totpEnabled: false,
          totpSecret: null,
          totpBackupCodes: null,
        },
      })
      authorized = true
    }
  } else {
    // Verify TOTP code
    if (dbUser.totpSecret && verifyTotp(code.trim(), dbUser.totpSecret)) {
      await db.user.update({
        where: { id: user.id },
        data: {
          totpEnabled: false,
          totpSecret: null,
          totpBackupCodes: null,
        },
      })
      authorized = true
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: 'رمز غير صحيح' }, { status: 400 })
  }

  // Invalidate all sessions except current (force re-login without 2FA)
  // This is important — if 2FA was disabled by an attacker who stole the
  // session, the user's other sessions should be logged out.
  const authHeader = req.headers.get('authorization')
  let currentToken: string | null = null
  if (authHeader && authHeader.startsWith('Bearer ')) {
    currentToken = authHeader.substring(7)
  } else {
    currentToken = req.cookies.get('session_token')?.value ?? null
  }
  if (currentToken) {
    const { createHash } = await import('crypto')
    const currentHash = createHash('sha256').update(currentToken).digest('hex')
    await db.session.deleteMany({
      where: {
        userId: user.id,
        NOT: { tokenHash: currentHash },
      },
    }).catch(() => {})
  }

  return NextResponse.json({
    success: true,
    message: 'تم تعطيل 2FA',
  })
}
