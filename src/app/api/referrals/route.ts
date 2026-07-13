import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'

/**
 * GET /api/referrals
 * Returns the authenticated user's referral code + stats + list of people they
 * referred (masked).
 *
 * SECURITY: The POST endpoint that used to exist here was a money-printing
 * exploit — any user could claim 50 EGP for "referring" any user who had
 * already traded, by submitting their email. Referrals are now created
 * ONLY at signup time (in /api/auth/signup) when a `referralCode` is
 * supplied. The referrer earns their reward automatically when the
 * referred user completes their first trade (handled in /api/trades).
 */
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const referrals = await db.referral.findMany({
    where: { referrerId: user.id },
    include: {
      referred: { select: { id: true, name: true, email: true, createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const totalReferrals = referrals.length
  const completedReferrals = referrals.filter(r => r.status === 'COMPLETED' || r.status === 'REWARDED').length
  const totalReward = referrals.reduce((sum, r) => sum + Number(r.rewardEgp), 0)

  // Use the user's persistent referralCode from the DB (set at signup)
  const referralCode = user.referralCode

  return NextResponse.json({
    referralCode,
    stats: {
      total: totalReferrals,
      completed: completedReferrals,
      pending: totalReferrals - completedReferrals,
      totalReward,
    },
    referrals: referrals.map(r => ({
      id: r.id,
      status: r.status,
      rewardEgp: Number(r.rewardEgp),
      createdAt: r.createdAt,
      completedAt: r.completedAt,
      referred: {
        // Mask the email for privacy — only show the local part prefix.
        name: r.referred.name || r.referred.email.split('@')[0],
        email: r.referred.email,
        joinedAt: r.referred.createdAt,
      },
    })),
  })
}
