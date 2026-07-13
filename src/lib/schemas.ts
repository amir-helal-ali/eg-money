import { z } from 'zod'

/**
 * Zod schemas for all API request bodies.
 *
 * Centralizing validation here means:
 *   1. Consistent rules across endpoints (no more "this route validates phone, that one doesn't")
 *   2. Type-safe parsing — `safeParse` returns typed data or typed errors
 *   3. Self-documenting — the schema IS the spec
 *
 * Usage:
 *   const result = TradeCreateSchema.safeParse(body)
 *   if (!result.success) {
 *     return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
 *   }
 *   const { type, usdtAmount, egpAmount } = result.data
 */

// ===== Shared primitives =====

/** Finite positive number (rejects NaN, Infinity, -Infinity, 0, negatives). */
const positiveFinite = z.number().finite().positive()

/** Non-empty trimmed string. */
const nonEmptyString = z.string().trim().min(1)

/** Egyptian payment methods enum. */
export const PaymentMethodSchema = z.enum([
  'VODAFONE_CASH',
  'INSTAPAY',
  'FAWRY',
  'BANK_TRANSFER',
])

/** Trade type enum. */
export const TradeTypeSchema = z.enum(['BUY', 'SELL'])

/** P2P trade action enum (for PATCH /api/p2p/trades). */
export const P2pTradeActionSchema = z.enum([
  'MARK_PAID',
  'RELEASE',
  'CANCEL',
  'DISPUTE',
])

/** Dispute reason enum. */
export const DisputeReasonSchema = z.enum(['NO_PAYMENT', 'NO_RELEASE', 'OTHER'])

/** Dispute resolution enum (admin). */
export const DisputeResolutionSchema = z.enum([
  'RESOLVED_BUYER',
  'RESOLVED_SELLER',
  'CANCELLED',
])

/** Deposit action enum (admin). */
export const DepositActionSchema = z.enum(['APPROVE', 'REJECT'])

/** Withdrawal action enum (admin). */
export const WithdrawalActionSchema = z.enum(['APPROVE', 'REJECT'])

/** Price alert condition enum. */
export const PriceAlertConditionSchema = z.enum(['ABOVE', 'BELOW'])

/** OTP channel enum. */
export const OtpChannelSchema = z.enum(['EMAIL', 'PHONE'])

/** Currency enum. */
export const CurrencySchema = z.enum(['EGP', 'USDT'])

// ===== Auth schemas =====

export const SignupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128).refine(
    (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p),
    'كلمة المرور يجب أن تحتوي على أحرف كبيرة وصغيرة وأرقام ورموز',
  ),
  username: z.string().trim().min(3).max(20).regex(/^[a-zA-Z0-9_.-]+$/),
  phone: z.string().trim().min(1),
  countryCode: z.string().trim().min(1),
  referralCode: z.string().trim().optional(),
})

export const LoginSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1),
})

export const ForgotPasswordSchema = z.object({
  identifier: z.string().trim().min(1),
  channel: OtpChannelSchema.optional(),
})

export const VerifyOtpSchema = z.object({
  identifier: z.string().trim().min(1),
  otp: z.string().trim().min(4).max(10),
})

export const VerifyEmailConfirmSchema = z.object({
  otp: z.string().trim().min(4).max(10),
})

export const ResetPasswordSchema = z.object({
  resetToken: z.string().min(1),
  newPassword: z.string().min(8).max(128).refine(
    (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p),
    'كلمة المرور يجب أن تحتوي على أحرف كبيرة وصغيرة وأرقام ورموز',
  ),
})

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128).refine(
    (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p),
    'كلمة المرور يجب أن تحتوي على أحرف كبيرة وصغيرة وأرقام ورموز',
  ),
})

export const UpdatePhoneSchema = z.object({
  phone: z.string().trim().min(1),
  countryCode: z.string().trim().min(1),
})

export const UpdateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  email: z.string().email().max(255).optional(),
})

// ===== Trade schemas =====

export const TradeCreateSchema = z.object({
  type: TradeTypeSchema,
  usdtAmount: positiveFinite.optional(),
  egpAmount: positiveFinite.optional(),
}).refine(
  (data) => data.usdtAmount !== undefined || data.egpAmount !== undefined,
  'حدد كمية USDT أو مبلغ الجنيه',
)

// ===== Deposit schemas =====

export const DepositCreateSchema = z.object({
  amountEgp: positiveFinite,
  method: PaymentMethodSchema,
  currency: CurrencySchema.optional(),
})

export const DepositConfirmSchema = z.object({
  depositId: nonEmptyString,
  senderNumber: nonEmptyString,
  receiptImage: z.string().optional(),
})

export const AdminDepositActionSchema = z.object({
  depositId: nonEmptyString,
  action: DepositActionSchema,
  adminNote: z.string().max(500).optional(),
})

// ===== Withdrawal schemas =====

export const WithdrawalCreateSchema = z.object({
  amountEgp: positiveFinite,
  method: PaymentMethodSchema,
  destination: nonEmptyString,
})

export const AdminWithdrawalActionSchema = z.object({
  withdrawalId: nonEmptyString,
  action: WithdrawalActionSchema,
  adminNote: z.string().max(500).optional(),
})

// ===== P2P offer schemas =====

export const P2pOfferCreateSchema = z.object({
  type: TradeTypeSchema,
  usdtAmount: positiveFinite,
  priceEgp: positiveFinite,
  minOrderEgp: positiveFinite.optional(),
  maxOrderEgp: positiveFinite.optional(),
  paymentMethods: z.array(PaymentMethodSchema).min(1),
})

export const P2pOfferUpdateSchema = z.object({
  id: nonEmptyString,
  priceEgp: positiveFinite.optional(),
  usdtAmount: positiveFinite.optional(),
  minOrderEgp: positiveFinite.optional(),
  maxOrderEgp: positiveFinite.optional(),
  paymentMethods: z.array(PaymentMethodSchema).min(1).optional(),
})

// ===== P2P trade schemas =====

export const P2pTradeCreateSchema = z.object({
  offerId: nonEmptyString,
  usdtAmount: positiveFinite,
  paymentMethod: PaymentMethodSchema,
})

export const P2pTradeActionBodySchema = z.object({
  tradeId: nonEmptyString,
  action: P2pTradeActionSchema,
  paymentReference: z.string().max(500).optional(),
  receiptImage: z.string().optional(),
  reason: DisputeReasonSchema.optional(),
  description: z.string().max(2000).optional(),
})

// ===== P2P message schemas =====

export const P2pMessageCreateSchema = z.object({
  tradeId: nonEmptyString,
  message: z.string().trim().min(1).max(2000),
  attachmentUrl: z.string().max(500).optional(),
})

export const P2pMessageUpdateSchema = z.object({
  messageId: nonEmptyString,
  action: z.enum(['EDIT', 'DELETE']),
  text: z.string().trim().min(1).max(2000).optional(),
})

// ===== P2P review schema =====

export const P2pReviewCreateSchema = z.object({
  tradeId: nonEmptyString,
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(300).optional(),
})

// ===== Price alert schema =====

export const PriceAlertCreateSchema = z.object({
  condition: PriceAlertConditionSchema,
  targetPrice: z.number().finite().min(30).max(100),
})

// ===== Admin: adjust balance =====

export const AdminAdjustBalanceSchema = z.object({
  userId: nonEmptyString,
  currency: CurrencySchema,
  direction: z.enum(['CREDIT', 'DEBIT']),
  amount: positiveFinite,
  note: z.string().max(500).optional(),
})

// ===== Admin: dispute resolution =====

export const AdminDisputeResolveSchema = z.object({
  disputeId: nonEmptyString,
  resolution: DisputeResolutionSchema,
  notes: z.string().max(1000).optional(),
})

// ===== Cron: price alerts check =====

export const PriceAlertCheckSchema = z.object({
  currentPrice: z.number().finite().min(30).max(100),
})

// ===== Helper: safe parse =====

/**
 * Parse a request body against a zod schema.
 * Returns `{ success: true, data }` or `{ success: false, error }` where
 * error is the first issue's message (suitable for direct API response).
 */
export function parseBody<T>(
  schema: z.ZodType<T>,
  body: unknown,
):
  | { success: true; data: T }
  | { success: false; error: string } {
  const result = schema.safeParse(body)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const firstIssue = result.error.issues[0]
  return {
    success: false,
    error: firstIssue?.message || 'بيانات غير صحيحة',
  }
}
