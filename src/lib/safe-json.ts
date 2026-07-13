/**
 * Safe JSON parse helper.
 *
 * Returns the parsed value (typed as T) on success, or `fallback` on failure.
 * Use this for any `JSON.parse()` of data that comes from the DB (metadata
 * columns, JSON-encoded arrays) or from external sources — never trust that
 * the stored JSON is valid.
 *
 * Example:
 *   const meta = safeJsonParse<Record<string, unknown>>(row.metadata, null)
 *   const methods = safeJsonParse<string[]>(offer.paymentMethods, [])
 */
export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}
