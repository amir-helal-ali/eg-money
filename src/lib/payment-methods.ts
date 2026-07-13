/**
 * Typed helpers for the P2pOffer.paymentMethods column.
 *
 * The column is stored as a JSON-encoded string (Prisma SQLite doesn't have
 * a native JSON type). These helpers centralize the parse + serialize + validate
 * logic so callers don't have to remember to use safeJsonParse.
 *
 * PaymentMethod values are validated against the canonical enum here so a
 * malformed DB row can't crash an API route.
 */

import { safeJsonParse } from '@/lib/safe-json'

export const VALID_PAYMENT_METHODS = [
  'VODAFONE_CASH',
  'INSTAPAY',
  'FAWRY',
  'BANK_TRANSFER',
] as const

export type PaymentMethodCode = (typeof VALID_PAYMENT_METHODS)[number]

/**
 * Parse a paymentMethods JSON string into a typed array.
 * Returns [] for null/invalid input (defensive — never throws).
 * Filters out any values that aren't in the valid enum.
 */
export function parsePaymentMethods(raw: string | null | undefined): PaymentMethodCode[] {
  const parsed = safeJsonParse<unknown[]>(raw, [])
  if (!Array.isArray(parsed)) return []
  return parsed.filter((m): m is PaymentMethodCode =>
    typeof m === 'string' && (VALID_PAYMENT_METHODS as readonly string[]).includes(m),
  )
}

/**
 * Serialize a paymentMethods array for DB storage.
 * Validates each value against the enum before serializing.
 */
export function serializePaymentMethods(methods: string[]): string {
  const valid = methods.filter((m): m is PaymentMethodCode =>
    (VALID_PAYMENT_METHODS as readonly string[]).includes(m),
  )
  return JSON.stringify(valid)
}

/**
 * Validate that a payment method string is in the canonical enum.
 */
export function isValidPaymentMethod(method: string): method is PaymentMethodCode {
  return (VALID_PAYMENT_METHODS as readonly string[]).includes(method)
}
