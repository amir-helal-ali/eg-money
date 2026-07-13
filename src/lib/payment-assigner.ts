import { db } from '@/lib/db'

/**
 * Smart payment wallet assignment.
 * Finds the best available wallet for the given payment method that:
 * 1. Is active
 * 2. Has remaining daily capacity (depositDailyLimitEgp - todayTotalEgp >= amount)
 * 3. Has remaining monthly capacity (depositMonthlyLimitEgp - monthTotalEgp >= amount)
 * 4. Picks the one with the most remaining daily capacity (least used today)
 *
 * Also resets daily/monthly counters if a new day/month has started.
 *
 * SECURITY: The wallet selection + counter update happen in a single
 * `db.$transaction` to prevent two concurrent deposits from both reading
 * the same wallet capacity and exceeding the limit. The fresh read of
 * each wallet inside the transaction ensures SQLite's serializable
 * isolation prevents the race.
 */
export async function assignPaymentWallet(
  method: string,
  amountEgp: number,
): Promise<{ wallet: any | null; error?: string }> {
  // Get settings for limits (read outside tx — these rarely change)
  const settings = await db.settings.findFirst()
  const dailyLimit = Number(settings?.depositDailyLimitEgp || 60000)
  const monthlyLimit = Number(settings?.depositMonthlyLimitEgp || 200000)

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // ===== ATOMIC WALLET ASSIGNMENT =====
  // Wrap the wallet selection + counter update in a transaction.
  // We use a "select then conditional update" pattern: find a candidate
  // wallet, then attempt to update its counters ONLY if the current
  // todayTotalEgp / monthTotalEgp still allow the new amount. If the
  // conditional update affects 0 rows, we move to the next candidate.
  try {
    return await db.$transaction(async (tx) => {
      // Find all active wallets for this method, sorted by least used today
      const wallets = await tx.paymentWallet.findMany({
        where: { method, active: true },
        orderBy: [{ todayTotalEgp: 'asc' }, { sortOrder: 'asc' }],
      })

      if (wallets.length === 0) {
        return { wallet: null, error: 'لا توجد محافظ دفع متاحة لهذه الطريقة' }
      }

      for (const wallet of wallets) {
        // Reset daily/monthly counters if it's a new day/month
        let todayTotal = Number(wallet.todayTotalEgp)
        let monthTotal = Number(wallet.monthTotalEgp)

        if (!wallet.lastResetDate || new Date(wallet.lastResetDate) < todayStart) {
          todayTotal = 0
        }
        if (!wallet.lastResetMonth || new Date(wallet.lastResetMonth) < monthStart) {
          monthTotal = 0
        }

        // Check if this wallet can handle the amount
        const remainingDaily = dailyLimit - todayTotal
        const remainingMonthly = monthlyLimit - monthTotal

        if (remainingDaily >= amountEgp && remainingMonthly >= amountEgp) {
          // Conditional update: only succeed if the wallet is still in a
          // compatible state (counter hasn't been bumped by a concurrent
          // assignment). Use the row's current values as a CAS guard.
          const updateResult = await tx.paymentWallet.updateMany({
            where: {
              id: wallet.id,
              todayTotalEgp: wallet.todayTotalEgp,
              monthTotalEgp: wallet.monthTotalEgp,
            },
            data: {
              todayTotalEgp: todayTotal + amountEgp,
              monthTotalEgp: monthTotal + amountEgp,
              lastResetDate: todayStart,
              lastResetMonth: monthStart,
            },
          })

          if (updateResult.count === 0) {
            // Lost the race — another concurrent assignment changed the
            // counters. Try the next wallet.
            continue
          }

          return {
            wallet: {
              id: wallet.id,
              method: wallet.method,
              number: wallet.number,
              holderName: wallet.holderName,
              label: wallet.label,
              todayTotalEgp: todayTotal + amountEgp,
              monthTotalEgp: monthTotal + amountEgp,
              dailyLimit,
              monthlyLimit,
              remainingDaily: remainingDaily - amountEgp,
              remainingMonthly: remainingMonthly - amountEgp,
            },
          }
        }
      }

      return { wallet: null, error: 'جميع محافظ الدفع وصلت للحد اليومي أو الشهري. حاول لاحقاً.' }
    })
  } catch (e) {
    console.error('[payment-assigner] Failed to assign wallet:', e)
    return { wallet: null, error: 'فشل في حجز محفظة دفع. حاول لاحقاً.' }
  }
}
