import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, hashPassword, isLegacyPasswordHash, createSession } from '@/lib/auth'
import {
  isValidEmail, isValidUsername, normalizeUsername, isValidInternationalPhone,
} from '@/lib/validation'
import { createNotification } from '@/lib/notifications'
import { logLoginEvent } from '@/lib/login-history'
import { sendEmail, EMAIL_TEMPLATES } from '@/lib/email'
import { verifyTotp, verifyBackupCode } from '@/lib/totp'
import { safeJsonParse } from '@/lib/safe-json'
import { LoginSchema, parseBody } from '@/lib/schemas'

// Rate limiting: max 10 failed attempts per IP per 15 min
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 10
const attempts = new Map<string, { count: number; firstAt: number }>()

// Periodic sweep to prevent the `attempts` Map from growing unbounded with
// stale IP entries (e.g., IPs that succeeded and never returned, or IPs that
// hit once and never came back). Every ~1000 login requests, we drop entries
// whose window has expired.
let sweepCounter = 0
const SWEEP_INTERVAL = 1000

function sweepStaleAttempts() {
  const now = Date.now()
  for (const [ip, entry] of attempts.entries()) {
    if (now - entry.firstAt > RATE_LIMIT_WINDOW_MS) {
      attempts.delete(ip)
    }
  }
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSec?: number } {
  // Amortized sweep
  sweepCounter++
  if (sweepCounter >= SWEEP_INTERVAL) {
    sweepCounter = 0
    sweepStaleAttempts()
  }

  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || now - entry.firstAt > RATE_LIMIT_WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAt: now })
    return { allowed: true }
  }
  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfterSec = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - entry.firstAt)) / 1000)
    return { allowed: false, retryAfterSec }
  }
  entry.count++
  return { allowed: true }
}

function clearRateLimit(ip: string) {
  attempts.delete(ip)
}

// Resolve the identifier (username / email / phone) to a user
async function findUserByIdentifier(identifier: string) {
  const trimmed = identifier.trim()
  if (!trimmed) return null

  // Try as email
  if (isValidEmail(trimmed)) {
    return await db.user.findUnique({ where: { email: trimmed.toLowerCase() } })
  }

  // Try as international phone (starts with +)
  if (trimmed.startsWith('+') && isValidInternationalPhone(trimmed)) {
    // Phone is nullable → use findFirst
    return await db.user.findFirst({ where: { phone: trimmed } })
  }

  // Try as username (normalized lowercase)
  if (isValidUsername(trimmed)) {
    const normalized = normalizeUsername(trimmed)
    return await db.user.findUnique({ where: { username: normalized } })
  }

  return null
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'

    const rate = checkRateLimit(ip)
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `محاولات كثيرة فاشلة. حاول مرة أخرى بعد ${rate.retryAfterSec} ثانية`,
        },
        { status: 429 },
      )
    }

    const body = await req.json()

    // ===== Zod validation =====
    const parsed = parseBody(LoginSchema, { identifier: body.identifier, password: body.password })
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error, field: 'identifier' },
        { status: 400 },
      )
    }
    const { identifier, password } = parsed.data
    const totpCode = body.totpCode as string | undefined
    const backupCode = body.backupCode as string | undefined

    const user = await findUserByIdentifier(identifier)
    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      // Log failed login attempt (if user exists)
      if (user) {
        await logLoginEvent(user.id, 'FAILED_LOGIN', req, {
          success: false,
          failureReason: 'WRONG_PASSWORD',
        })
      }
      return NextResponse.json(
        { error: 'بيانات الدخول غير صحيحة', field: 'identifier' },
        { status: 401 },
      )
    }

    if (user.status !== 'ACTIVE') {
      await logLoginEvent(user.id, 'FAILED_LOGIN', req, {
        success: false,
        failureReason: 'SUSPENDED',
      })
      return NextResponse.json(
        { error: 'هذا الحساب موقوف. تواصل مع الإدارة' },
        { status: 403 },
      )
    }

    // ===== 2FA / TOTP verification =====
    // If the user has 2FA enabled, require a valid TOTP code OR backup code.
    // Password was already verified above, so this is the second factor.
    // We return 200 with `requiresTotp: true` (NOT 401) so the frontend can
    // distinguish "wrong password" from "needs 2FA code".
    if (user.totpEnabled && user.totpSecret) {
      if (!totpCode && !backupCode) {
        // Don't clear rate limit — the user must still provide the 2FA code
        return NextResponse.json(
          {
            requiresTotp: true,
            message: 'أدخل رمز المصادقة الثنائية من تطبيقك',
          },
          { status: 200 },
        )
      }

      let totpValid = false
      if (backupCode) {
        // Verify backup code (single-use)
        const hashedCodes = safeJsonParse<string[]>(user.totpBackupCodes, [])
        const matchIdx = verifyBackupCode(backupCode, hashedCodes)
        if (matchIdx >= 0) {
          // Remove the used backup code
          const remaining = hashedCodes.filter((_, i) => i !== matchIdx)
          await db.user.update({
            where: { id: user.id },
            data: { totpBackupCodes: JSON.stringify(remaining) },
          })
          totpValid = true
        }
      } else if (totpCode) {
        totpValid = verifyTotp(totpCode.trim(), user.totpSecret)
      }

      if (!totpValid) {
        await logLoginEvent(user.id, 'FAILED_LOGIN', req, {
          success: false,
          failureReason: 'WRONG_TOTP',
        })
        return NextResponse.json(
          { error: 'رمز المصادقة الثنائية غير صحيح', field: 'totp' },
          { status: 401 },
        )
      }
    }

    clearRateLimit(ip)
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // ===== Transparent password hash upgrade =====
    // If the user's password is stored in the legacy (multi-round SHA-512)
    // format, re-hash it with scrypt now that we've verified it's correct.
    // This is non-blocking — if it fails, the user can still log in next time.
    if (isLegacyPasswordHash(user.passwordHash)) {
      try {
        const newHash = hashPassword(password)
        await db.user.update({
          where: { id: user.id },
          data: { passwordHash: newHash },
        })
      } catch (e) {
        console.error('[login] Failed to upgrade password hash:', e)
        // Non-fatal — keep the legacy hash for now
      }
    }

    // Security notification: new login
    const userAgent = req.headers.get('user-agent') || 'unknown'
    await createNotification({
      userId: user.id,
      type: 'SECURITY',
      title: '🔐 تسجيل دخول جديد',
      message: `تم تسجيل الدخول لحسابك من IP: ${ip} في ${new Date().toLocaleString('ar-EG')}`,
      metadata: { ip, userAgent: userAgent.substring(0, 100), action: 'LOGIN' },
    }).catch(() => {}) // non-critical

    const token = await createSession(user.id, ip, userAgent)

    // Log successful login
    await logLoginEvent(user.id, 'LOGIN', req, {
      success: true,
      sessionToken: token.substring(0, 16), // store partial for session matching
    })

    // Send email alert (respects user's emailSecurity preference)
    sendEmail(user.id, 'security', EMAIL_TEMPLATES.loginAlert(
      ip,
      userAgent.substring(0, 200),
      new Date().toLocaleString('ar-EG'),
    )).catch(() => {}) // non-critical

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
    console.error('Login error:', e)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}
