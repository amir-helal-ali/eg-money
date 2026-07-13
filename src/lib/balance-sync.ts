import { db } from '@/lib/db'
import { tickerPost } from '@/lib/ticker-client'

/**
 * Push a real-time balance update to a user via WebSocket.
 * Call this after ANY transaction that changes a user's balance:
 * - Trade (buy/sell)
 * - Deposit approval
 * - Withdrawal approval/rejection
 * - P2P trade (take/release/cancel)
 *
 * This makes ALL components showing the balance update instantly
 * without needing a page refresh or fetchUser() call.
 */
export async function pushBalanceUpdate(userId: string) {
  try {
    // Fetch the current balances from DB
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { egpBalance: true, usdtBalance: true },
    })
    if (!user) return

    const balances = {
      egpBalance: Number(user.egpBalance),
      usdtBalance: Number(user.usdtBalance),
      timestamp: Date.now(),
    }

    // Push to ticker-service (uses internal secret + timeout via tickerPost)
    await tickerPost('/balance-update', { userId, balances })
  } catch {
    // Non-critical — don't block the transaction
  }
}

/**
 * Push balance updates to multiple users (e.g., P2P trade where both parties' balances change).
 */
export async function pushBalanceUpdates(userIds: string[]) {
  for (const userId of userIds) {
    await pushBalanceUpdate(userId)
  }
}
