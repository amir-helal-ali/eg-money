import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/session'

// GET /api/admin/verifications
// Returns users needing email/phone verification + users with active OTPs
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  // Users with unverified email or phone
  const unverifiedUsers = await db.user.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { emailVerified: false },
        { phoneVerified: false },
      ],
    },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      phone: true,
      emailVerified: true,
      phoneVerified: true,
      // We need otpCode only to check its existence (boolean), not its value.
      // Prisma doesn't support `select: { otpCode: { _exists: true } }`, so we
      // fetch it but NEVER return it to the client (see mapping below).
      otpCode: true,
      otpChannel: true,
      otpExpires: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  // Filter to only those with active OTPs or unverified.
  // SECURITY: Never expose the raw OTP to admins — only the existence + channel.
  const now = new Date()
  const result = unverifiedUsers.map((u) => ({
    id: u.id,
    email: u.email,
    username: u.username,
    name: u.name,
    phone: u.phone,
    emailVerified: u.emailVerified,
    phoneVerified: u.phoneVerified,
    hasActiveOtp: !!(u.otpCode && u.otpExpires && u.otpExpires > now),
    // SECURITY: Only expose whether an OTP is active + which channel + expiry.
    // Never expose the OTP code itself — admins must not be able to read it.
    // DO NOT return otpCode here — admins must not see the code itself.
    otpChannel: u.otpChannel,
    otpExpires: u.otpExpires,
    createdAt: u.createdAt,
  }))

  return NextResponse.json({
    users: result,
    stats: {
      total: result.length,
      emailUnverified: result.filter((u) => !u.emailVerified).length,
      phoneUnverified: result.filter((u) => !u.phoneVerified && u.phone).length,
      noPhone: result.filter((u) => !u.phone).length,
      activeOtps: result.filter((u) => u.hasActiveOtp).length,
    },
  })
}
