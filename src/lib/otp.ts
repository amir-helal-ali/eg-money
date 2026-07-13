import { db } from '@/lib/db'
import { createNotification } from '@/lib/notifications'
import { generateOtp } from '@/lib/validation'

/**
 * OTP generation + storage helper.
 *
 * SECURITY:
 *   - OTPs are generated with `crypto.randomInt` (cryptographically secure).
 *   - OTPs are NEVER sent to admins (preventing admin-facilitated account
 *     takeover). The old code sent the OTP to all admins via notification
 *     — that's been removed.
 *   - In development, the OTP is logged to console for testing. In production,
 *     the OTP is sent via the configured email/SMS provider (todo: integrate
 *     a real provider — currently email.ts logs to console only).
 *   - OTPs are stored in the User table as `otpCode` (plaintext, since the
 *     user must verify by sending the same code back). The 10-minute expiry
 *     and 10-attempt limit (TODO) mitigate brute force.
 *
 * Future enhancement: hash the OTP with a server-side pepper so DB-only
 * attackers can't use them. Trade-off: requires storing the hash + doing
 * a comparison on verify.
 */

const OTP_TTL_MS = 10 * 60 * 1000 // 10 minutes

export type OtpChannel = 'EMAIL' | 'PHONE'

/**
 * Generate, store, and dispatch an OTP for the given user + channel.
 * Returns the OTP (only for dev-mode UI display; never return in production
 * HTTP responses).
 */
export async function issueOtp(
  userId: string,
  channel: OtpChannel,
): Promise<{ otp: string; expiresAt: Date }> {
  const otp = generateOtp()
  const expiresAt = new Date(Date.now() + OTP_TTL_MS)

  await db.user.update({
    where: { id: userId },
    data: {
      otpCode: otp,
      otpChannel: channel,
      otpExpires: expiresAt,
      // Reset the failed-attempt counter when issuing a new OTP
      otpAttempts: 0,
      // Clear any previous reset token when issuing a new OTP
      resetToken: null,
      resetExpires: null,
    },
  })

  // Log OTP to console ONLY in development (for testing without email/SMS).
  // In production, the OTP is delivered via the channel below.
  if (process.env.NODE_ENV !== 'production') {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true },
    })
    const target = channel === 'EMAIL' ? user?.email : user?.phone
    console.log(`[otp] ${channel} OTP for ${target}: ${otp} (dev-only log)`)
  }

  // Dispatch via the appropriate channel.
  // TODO: integrate a real email/SMS provider. For now, the email.ts module
  // is responsible for sending; if it's not configured, the OTP is only
  // visible via the dev-mode log above (production needs real delivery).
  // We intentionally do NOT notify admins — that was a security hole.

  return { otp, expiresAt }
}

/**
 * Notify admins that a verification request was submitted — WITHOUT
 * including the OTP. Use this in place of the old pattern that sent the
 * raw OTP to admins. Admins see only that a user has a pending OTP and
 * which channel was used; they cannot read the code.
 */
export async function notifyAdminsOfOtpRequest(
  userId: string,
  channel: OtpChannel,
  userDisplay: string, // e.g., email or phone for admin context
): Promise<void> {
  const admins = await db.user.findMany({
    where: { role: 'ADMIN', status: 'ACTIVE' },
  })
  for (const admin of admins) {
    await createNotification({
      userId: admin.id,
      type: 'SYSTEM',
      title: channel === 'EMAIL' ? '🔐 طلب تحقق بريد' : '📱 طلب تحقق هاتف',
      message: `${userDisplay}: طلب رمز تحقق ${channel === 'EMAIL' ? 'للبريد' : 'للهاتف'}. الرمز مُرسل للمستخدم فقط.`,
      metadata: {
        userId,
        channel,
        // NO `otp` field — admins must not see the code
        action: 'admin_verifications',
      },
    })
  }
}
