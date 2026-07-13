import { db } from '@/lib/db'
import { creditEgp, getSettings } from '@/lib/money'
import { createNotification } from '@/lib/notifications'
import { pushBalanceUpdate } from '@/lib/balance-sync'

/**
 * Default referral reward (EGP). Used as a fallback if Settings isn't loaded.
 * The actual reward amount is configurable via the Settings table
 * (referralRewardEgp field, set by admin).
 */
export const DEFAULT_REFERRAL_REWARD_EGP = 50

/**
 * Auto-completes a referral reward on the referred user's first trade.
 *
 * Flow:
 *   1. Look up the referral row where `referredId === userId` and status is PENDING.
 *   2. If found, atomically mark it as REWARDED and credit the referrer.
 *   3. Notify the referrer.
 *
 * The reward amount comes from Settings.referralRewardEgp (admin-configurable).
 *
 * SECURITY: Unlike the old POST /api/referrals endpoint, this is invoked
 * automatically by the trade flow. The referrer CANNOT trigger it manually
 * or claim rewards for users they didn't actually refer at signup time.
 */
export async function processReferralReward(
  userId: string,
  tradeId: string,
): Promise<void> {
  // Find the pending referral for this user
  const referral = await db.referral.findFirst({
    where: { referredId: userId, status: 'PENDING' },
  })
  if (!referral) return

  // Get the configurable reward amount from Settings
  const settings = await getSettings()
  const rewardEgp = settings.referralRewardEgp || DEFAULT_REFERRAL_REWARD_EGP

  // Atomically transition PENDING → REWARDED. The conditional updateMany
  // ensures only one concurrent caller can claim the reward.
  const result = await db.referral.updateMany({
    where: { id: referral.id, status: 'PENDING' },
    data: {
      status: 'REWARDED',
      rewardEgp,
      completedAt: new Date(),
    },
  })
  if (result.count === 0) return // someone else got there first

  // Credit the referrer — this is itself a transactional money op
  await creditEgp(
    referral.referrerId,
    rewardEgp,
    'REFERRAL',
    `مكافأة إحالة: ${referral.code}`,
    referral.id,
    'REFERRAL',
  )

  // Notify the referrer
  await createNotification({
    userId: referral.referrerId,
    type: 'PROMO',
    title: '🎁 مكافأة إحالة!',
    message: `حصلت على ${rewardEgp} جنيه! مستخدم دُعي بكود الإحالة ${referral.code} أتمم أول صفقة.`,
    metadata: { referralId: referral.id, rewardEgp, tradeId },
  })

  // Push real-time balance update to the referrer
  await pushBalanceUpdate(referral.referrerId)
}
