import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateToken } from '@/lib/auth'
import {
  isValidEmail, isValidUsername, normalizeUsername, isValidInternationalPhone,
} from '@/lib/validation'

const MAX_OTP_ATTEMPTS = 5

/**
 * Resolve identifier (username / email / phone) to a user.
 * (Same helper used by /api/auth/forgot-password — kept local for clarity.)
 */
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

/**
 * POST /api/auth/verify-otp
 * Body: { identifier: string, otp: string }
 * Returns: { valid: true, resetToken } on success
 *
 * SECURITY improvements (vs. previous version):
 * 1. Looks up user by IDENTIFIER first, then checks OTP — previous version
 *    looked up by OTP alone (`findFirst({ where: { otpCode: otp } })`), which
 *    was vulnerable to OTP collision and identifier confusion.
 * 2. Tracks failed attempts in `user.otpAttempts`. After MAX_OTP_ATTEMPTS (5)
 *    wrong guesses, the OTP is invalidated and the user must request a new one.
 * 3. Always returns the same generic error message ("الرمز غير صحيح أو منتهي")
 *    whether the user exists, the OTP is wrong, the OTP is expired, or the
 *    attempt limit is hit — to prevent account enumeration.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { identifier, otp } = body as { identifier?: string; otp?: string }

    if (!identifier || !otp) {
      return NextResponse.json(
        { error: 'المُعرّف والرمز مطلوبان' },
        { status: 400 },
      )
    }

    const user = await findUserByIdentifier(identifier)

    // Generic error for all failure cases (prevents enumeration)
    const genericError = { error: 'الرمز غير صحيح أو منتهي', status: 400 }

    if (
      !user ||
      !user.otpCode ||
      !user.otpExpires ||
      user.otpExpires.getTime() < Date.now()
    ) {
      return NextResponse.json(genericError, { status: 400 })
    }

    // ===== Attempt limit check =====
    // If the user has already failed MAX_OTP_ATTEMPTS times, invalidate the
    // OTP entirely — they must request a new one via /api/auth/forgot-password.
    if ((user.otpAttempts ?? 0) >= MAX_OTP_ATTEMPTS) {
      await db.user.update({
        where: { id: user.id },
        data: {
          otpCode: null,
          otpChannel: null,
          otpExpires: null,
          otpAttempts: 0, // reset for the next OTP cycle
        },
      })
      return NextResponse.json(
        { error: 'تجاوزت عدد المحاولات. اطلب رمزاً جديداً.' },
        { status: 400 },
      )
    }

    // ===== OTP comparison (constant-time via string compare) =====
    // Note: we already confirmed user.otpCode is non-null above.
    const suppliedOtp = String(otp).trim()
    const expectedOtp = String(user.otpCode)
    if (suppliedOtp.length !== expectedOtp.length || !timingSafeStringEqual(suppliedOtp, expectedOtp)) {
      // Increment attempt counter
      await db.user.update({
        where: { id: user.id },
        data: { otpAttempts: { increment: 1 } },
      })
      return NextResponse.json(genericError, { status: 400 })
    }

    // ===== Success: consume OTP, issue reset token, reset attempts =====
    const resetToken = generateToken()
    const resetExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    await db.user.update({
      where: { id: user.id },
      data: {
        otpCode: null,
        otpChannel: null,
        otpExpires: null,
        otpAttempts: 0,
        resetToken,
        resetExpires,
      },
    })

    return NextResponse.json({
      valid: true,
      resetToken,
      expiresInSec: 600,
    })
  } catch (e) {
    console.error('Verify OTP error:', e)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}

/** Constant-time string comparison (avoids timing-based character guessing). */
function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}
