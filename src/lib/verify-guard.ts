import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'

/**
 * Middleware-like helper that checks if the user is verified.
 * Returns null if verified (continue), or a NextResponse with error if not.
 *
 * Usage in API routes:
 *   const verifyError = await requireVerified(req)
 *   if (verifyError) return verifyError
 */
export async function requireVerified(req: NextRequest): Promise<NextResponse | null> {
  const user = await getAuthUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings = await db.settings.findFirst()
  const requireEmail = settings?.requireEmailVerification ?? true
  const requirePhone = settings?.requirePhoneVerification ?? true

  if (requireEmail && !user.emailVerified) {
    return NextResponse.json(
      { error: 'يجب تأكيد البريد الإلكتروني أولاً', code: 'EMAIL_NOT_VERIFIED' },
      { status: 403 },
    )
  }

  if (requirePhone && user.phone && !user.phoneVerified) {
    return NextResponse.json(
      { error: 'يجب تأكيد رقم الهاتف أولاً', code: 'PHONE_NOT_VERIFIED' },
      { status: 403 },
    )
  }

  return null // all good, continue
}
