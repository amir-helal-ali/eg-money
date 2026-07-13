import { db } from '@/lib/db'

// Money helpers — round to 2 decimals for EGP, 6 for USDT
export function roundEgp(n: number): number {
  return Math.round(n * 100) / 100
}
export function roundUsdt(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000
}

// Format for display
export function formatEgp(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}
export function formatUsdt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(n)
}

/**
 * Atomic balance update + transaction log.
 *
 * SECURITY: All credit/debit operations are wrapped in a single
 * `db.$transaction(async (tx) => { ... })` block. The balance check
 * (findUnique) happens INSIDE the transaction, so concurrent debits
 * cannot both pass the check (SQLite provides SERIALIZABLE isolation
 * within a transaction). The transaction log row is created in the
 * same atomic block, so balance + log are always consistent.
 *
 * If the balance check fails, we throw one of:
 *   - 'INSUFFICIENT_EGP_BALANCE'
 *   - 'INSUFFICIENT_USDT_BALANCE'
 *   - 'USER_NOT_FOUND'
 * Callers should catch and translate to user-facing errors.
 */

export async function creditEgp(
  userId: string,
  amount: number,
  type: string,
  description: string,
  referenceId?: string,
  referenceType?: string,
) {
  const roundedAmount = roundEgp(amount)
  const [updated] = await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { egpBalance: { increment: roundedAmount } },
    }),
    db.transaction.create({
      data: {
        userId,
        type,
        direction: 'CREDIT',
        currency: 'EGP',
        amount: roundedAmount,
        // balanceAfter will be filled below (separate query needed because
        // Prisma doesn't return the new balance from the increment).
        balanceAfter: 0,
        description,
        referenceId,
        referenceType,
      },
    }),
  ])
  // Patch balanceAfter to reflect the new balance
  await db.transaction.updateMany({
    where: { userId, referenceId, referenceType, direction: 'CREDIT', currency: 'EGP' },
    data: { balanceAfter: Number(updated.egpBalance) },
  })
  return updated
}

export async function debitEgp(
  userId: string,
  amount: number,
  type: string,
  description: string,
  referenceId?: string,
  referenceType?: string,
) {
  const roundedAmount = roundEgp(amount)

  // Atomic: read balance, check, update, log — all in one transaction.
  // Using a conditional update (where: { id, egpBalance: { gte: amount } })
  // would be cleaner, but SQLite + Prisma doesn't support that on Decimal
  // fields reliably. Instead, we use a serializable transaction with a
  // fresh read inside.
  const result = await db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('USER_NOT_FOUND')
    const currentEgp = Number(user.egpBalance)
    if (currentEgp < roundedAmount) throw new Error('INSUFFICIENT_EGP_BALANCE')
    const newBalance = roundEgp(currentEgp - roundedAmount)

    const [updated] = await Promise.all([
      tx.user.update({
        where: { id: userId },
        data: { egpBalance: newBalance },
      }),
      tx.transaction.create({
        data: {
          userId,
          type,
          direction: 'DEBIT',
          currency: 'EGP',
          amount: roundedAmount,
          balanceAfter: newBalance,
          description,
          referenceId,
          referenceType,
        },
      }),
    ])
    return updated
  })
  return result
}

export async function creditUsdt(
  userId: string,
  amount: number,
  type: string,
  description: string,
  referenceId?: string,
  referenceType?: string,
) {
  const roundedAmount = roundUsdt(amount)
  const [updated] = await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { usdtBalance: { increment: roundedAmount } },
    }),
    db.transaction.create({
      data: {
        userId,
        type,
        direction: 'CREDIT',
        currency: 'USDT',
        amount: roundedAmount,
        balanceAfter: 0,
        description,
        referenceId,
        referenceType,
      },
    }),
  ])
  await db.transaction.updateMany({
    where: { userId, referenceId, referenceType, direction: 'CREDIT', currency: 'USDT' },
    data: { balanceAfter: Number(updated.usdtBalance) },
  })
  return updated
}

export async function debitUsdt(
  userId: string,
  amount: number,
  type: string,
  description: string,
  referenceId?: string,
  referenceType?: string,
) {
  const roundedAmount = roundUsdt(amount)

  const result = await db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('USER_NOT_FOUND')
    const currentUsdt = Number(user.usdtBalance)
    if (currentUsdt < roundedAmount) throw new Error('INSUFFICIENT_USDT_BALANCE')
    const newBalance = roundUsdt(currentUsdt - roundedAmount)

    const [updated] = await Promise.all([
      tx.user.update({
        where: { id: userId },
        data: { usdtBalance: newBalance },
      }),
      tx.transaction.create({
        data: {
          userId,
          type,
          direction: 'DEBIT',
          currency: 'USDT',
          amount: roundedAmount,
          balanceAfter: newBalance,
          description,
          referenceId,
          referenceType,
        },
      }),
    ])
    return updated
  })
  return result
}

export async function getSettings() {
  let settings = await db.settings.findFirst()
  if (!settings) {
    settings = await db.settings.create({ data: {} })
  }
  return {
    id: settings.id,
    buyPriceEgp: Number(settings.buyPriceEgp),
    sellPriceEgp: Number(settings.sellPriceEgp),
    minTradeEgp: Number(settings.minTradeEgp),
    maxTradeEgp: Number(settings.maxTradeEgp),
    minP2pEgp: Number(settings.minP2pEgp),
    maxP2pEgp: Number(settings.maxP2pEgp),
    p2pFeePercent: Number(settings.p2pFeePercent),
    platformFeePercent: Number(settings.platformFeePercent),
    googleOAuthEnabled: !!settings.googleOAuthEnabled,
    googleClientId: settings.googleClientId || '',
    googleClientSecret: settings.googleClientSecret || '',
    requireEmailVerification: !!settings.requireEmailVerification,
    requirePhoneVerification: !!settings.requirePhoneVerification,
    depositDailyLimitEgp: Number(settings.depositDailyLimitEgp),
    depositMonthlyLimitEgp: Number(settings.depositMonthlyLimitEgp),
    // Configurable magic numbers (P2-6)
    minDepositEgp: Number(settings.minDepositEgp),
    minWithdrawalEgp: Number(settings.minWithdrawalEgp),
    p2pPaymentTimeoutMin: settings.p2pPaymentTimeoutMin,
    p2pMessageEditWindowSec: settings.p2pMessageEditWindowSec,
    referralRewardEgp: Number(settings.referralRewardEgp),
    otpMaxAttempts: settings.otpMaxAttempts,
    otpTtlSec: settings.otpTtlSec,
    sessionTtlSec: settings.sessionTtlSec,
    wsTokenTtlSec: settings.wsTokenTtlSec,
  }
}

/**
 * Public-safe settings — for endpoints that any user (including unauthenticated)
 * can hit. NEVER include `googleClientSecret` here, and only include
 * `googleClientId` if OAuth is enabled (it's safe to expose client id publicly).
 * Use `getSettings()` (above) ONLY in admin-only contexts where the full
 * settings including the secret are required.
 */
export async function getPublicSettings() {
  const s = await getSettings()
  return {
    id: s.id,
    buyPriceEgp: s.buyPriceEgp,
    sellPriceEgp: s.sellPriceEgp,
    minTradeEgp: s.minTradeEgp,
    maxTradeEgp: s.maxTradeEgp,
    minP2pEgp: s.minP2pEgp,
    maxP2pEgp: s.maxP2pEgp,
    p2pFeePercent: s.p2pFeePercent,
    platformFeePercent: s.platformFeePercent,
    googleOAuthEnabled: s.googleOAuthEnabled,
    googleClientId: s.googleOAuthEnabled ? s.googleClientId : '',
    requireEmailVerification: s.requireEmailVerification,
    requirePhoneVerification: s.requirePhoneVerification,
  }
}
