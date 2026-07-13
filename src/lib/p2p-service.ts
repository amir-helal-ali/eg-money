/**
 * P2P trade error mapping + shared helpers.
 *
 * The /api/p2p/trades route is large (~800 lines) because it handles 4 actions
 * (MARK_PAID, RELEASE, CANCEL, DISPUTE) plus the create flow. Extracting the
 * error mapping + settlement helpers here keeps the route file readable while
 * keeping all the money-moving logic in one place (important for audit).
 *
 * Usage in route handlers:
 *   try {
 *     await db.$transaction(async (tx) => { ... })
 *   } catch (e: any) {
 *     return mapTradeError(e)
 *   }
 */

import { NextResponse } from 'next/server'

/**
 * Maps an internal P2P trade error (thrown as `new Error('CODE')` inside a
 * transaction) to a user-facing HTTP response. Returns null for unrecognized
 * errors so the caller can rethrow or handle generically.
 */
export function mapTradeError(e: unknown): NextResponse | null {
  const msg = e instanceof Error ? e.message : String(e)

  const errorMap: Record<string, { status: number; error: string }> = {
    OFFER_NOT_FOUND: { status: 404, error: 'الإعلان غير موجود' },
    OFFER_NOT_ACTIVE: { status: 400, error: 'الإعلان غير نشط' },
    CANNOT_TRADE_WITH_SELF: { status: 400, error: 'لا يمكنك التداول مع نفسك' },
    PAYMENT_METHOD_NOT_ALLOWED: { status: 400, error: 'طريقة الدفع غير مدعومة في هذا الإعلان' },
    AMOUNT_REQUIRED: { status: 400, error: 'حدد كمية USDT أو مبلغ الجنيه' },
    INVALID_AMOUNT: { status: 400, error: 'المبالغ غير صحيحة' },
    EXCEEDS_OFFER_AMOUNT: { status: 400, error: 'الكمية تتجاوز المبلغ المتاح في الإعلان' },
    OUT_OF_RANGE: { status: 400, error: 'المبلغ خارج نطاق الإعلان' },
    USER_NOT_FOUND: { status: 404, error: 'المستخدم غير موجود' },
    INSUFFICIENT_EGP_BALANCE: { status: 400, error: 'رصيد الجنيه غير كافٍ' },
    INSUFFICIENT_USDT_BALANCE: { status: 400, error: 'رصيد USDT غير كافٍ' },
    TRADE_NOT_FOUND: { status: 404, error: 'الصفقة غير موجودة' },
    NOT_AUTHORIZED: { status: 403, error: 'غير مصرح' },
    ALREADY_PAID: { status: 400, error: 'تم تأكيد الدفع مسبقاً' },
    DISPUTE_ALREADY_EXISTS: { status: 400, error: 'يوجد نزاع مفتوح لهذه الصفقة' },
    ALREADY_RESOLVED: { status: 400, error: 'النزاع تم حله مسبقاً' },
    ALREADY_PROCESSED: { status: 400, error: 'تمت معالجة هذا الطلب مسبقاً' },
  }

  const mapped = errorMap[msg]
  if (mapped) {
    return NextResponse.json({ error: mapped.error }, { status: mapped.status })
  }
  return null
}

/**
 * Saves a base64-encoded receipt image to /uploads/ (outside /public/).
 * Returns the API path to serve it, or null if the image was invalid.
 *
 * Extracted here so both /api/deposits/confirm and /api/p2p/trades can share
 * the same logic without duplication.
 */
export async function saveReceiptImage(
  base64Image: string,
  prefix: string,
  id: string,
): Promise<string | null> {
  if (!base64Image || typeof base64Image !== 'string' || base64Image.length < 100) {
    return null
  }
  try {
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    const filename = `${prefix}-${id}-${Date.now()}.png`
    const fs = await import('fs')
    const path = await import('path')
    const uploadDir = path.join(process.cwd(), 'uploads', prefix === 'p2p' ? 'p2p-receipts' : 'receipts')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    fs.writeFileSync(path.join(uploadDir, filename), buffer)
    return `/api/uploads/${prefix === 'p2p' ? 'p2p-receipts' : 'receipts'}/${filename}`
  } catch (e) {
    console.error(`[${prefix}] receipt upload error:`, e)
    return null
  }
}
