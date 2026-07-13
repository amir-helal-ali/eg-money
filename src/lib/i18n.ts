/**
 * Centralized error message translations.
 *
 * Previously, error messages were a mix of Arabic and English scattered
 * across API routes. This module provides a single source of truth for
 * user-facing messages, with Arabic as the primary language (matching the
 * app's UI) and English as fallback.
 *
 * Usage:
 *   import { t, ErrorKey } from '@/lib/i18n'
 *   return NextResponse.json({ error: t('UNAUTHORIZED') }, { status: 401 })
 *
 * To add a new message:
 *   1. Add the key to ErrorKey type
 *   2. Add the Arabic + English strings to MESSAGES
 */

export type ErrorKey =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'INVALID_INPUT'
  | 'INSUFFICIENT_EGP'
  | 'INSUFFICIENT_USDT'
  | 'USER_NOT_FOUND'
  | 'USER_SUSPENDED'
  | 'WRONG_CREDENTIALS'
  | 'WRONG_TOTP'
  | 'EMAIL_EXISTS'
  | 'USERNAME_EXISTS'
  | 'PHONE_EXISTS'
  | 'INVALID_EMAIL'
  | 'INVALID_USERNAME'
  | 'INVALID_PHONE'
  | 'WEAK_PASSWORD'
  | 'OTP_REQUIRED'
  | 'OTP_INVALID'
  | 'OTP_EXPIRED'
  | 'OTP_MAX_ATTEMPTS'
  | 'TRADE_LIVE_PRICE_UNAVAILABLE'
  | 'TRADE_AMOUNT_OUT_OF_RANGE'
  | 'P2P_OFFER_NOT_FOUND'
  | 'P2P_OFFER_NOT_ACTIVE'
  | 'P2P_CANNOT_TRADE_SELF'
  | 'P2P_RELEASE_REQUIRES_PAID'
  | 'DEPOSIT_ALREADY_PROCESSED'
  | 'WITHDRAWAL_INSUFFICIENT_BALANCE'
  | 'DISPUTE_ALREADY_RESOLVED'
  | 'SESSION_EXPIRED'
  | 'CONFIG_MISSING_SECRETS'

const MESSAGES: Record<ErrorKey, { ar: string; en: string }> = {
  UNAUTHORIZED: { ar: 'غير مصرح', en: 'Unauthorized' },
  FORBIDDEN: { ar: 'ممنوع', en: 'Forbidden' },
  NOT_FOUND: { ar: 'غير موجود', en: 'Not found' },
  RATE_LIMITED: { ar: 'تم تجاوز عدد الطلبات المسموح. حاول لاحقاً.', en: 'Rate limit exceeded. Try later.' },
  INTERNAL_ERROR: { ar: 'حدث خطأ غير متوقع', en: 'An unexpected error occurred' },
  INVALID_INPUT: { ar: 'بيانات غير صحيحة', en: 'Invalid input' },

  INSUFFICIENT_EGP: { ar: 'رصيد الجنيه غير كافٍ', en: 'Insufficient EGP balance' },
  INSUFFICIENT_USDT: { ar: 'رصيد USDT غير كافٍ', en: 'Insufficient USDT balance' },
  USER_NOT_FOUND: { ar: 'المستخدم غير موجود', en: 'User not found' },
  USER_SUSPENDED: { ar: 'هذا الحساب موقوف. تواصل مع الإدارة', en: 'This account is suspended. Contact support.' },
  WRONG_CREDENTIALS: { ar: 'بيانات الدخول غير صحيحة', en: 'Invalid credentials' },
  WRONG_TOTP: { ar: 'رمز المصادقة الثنائية غير صحيح', en: 'Invalid 2FA code' },

  EMAIL_EXISTS: { ar: 'هذا البريد الإلكتروني مسجل مسبقاً', en: 'Email already registered' },
  USERNAME_EXISTS: { ar: 'اسم المستخدم محجوز مسبقاً', en: 'Username already taken' },
  PHONE_EXISTS: { ar: 'رقم الهاتف مسجل مسبقاً', en: 'Phone number already registered' },
  INVALID_EMAIL: { ar: 'صيغة البريد الإلكتروني غير صحيحة', en: 'Invalid email format' },
  INVALID_USERNAME: { ar: 'اسم المستخدم غير صحيح (3-20 حرف: أحرف وأرقام و _ . -)', en: 'Invalid username (3-20 chars: letters, digits, _ . -)' },
  INVALID_PHONE: { ar: 'رقم هاتف غير صحيح', en: 'Invalid phone number' },
  WEAK_PASSWORD: { ar: 'كلمة المرور يجب أن تحتوي على أحرف كبيرة وصغيرة وأرقام ورموز', en: 'Password must include upper, lower, digit, and symbol' },

  OTP_REQUIRED: { ar: 'الرمز مطلوب', en: 'Code is required' },
  OTP_INVALID: { ar: 'الرمز غير صحيح', en: 'Invalid code' },
  OTP_EXPIRED: { ar: 'الرمز منتهي الصلاحية', en: 'Code expired' },
  OTP_MAX_ATTEMPTS: { ar: 'تجاوزت عدد المحاولات. اطلب رمزاً جديداً.', en: 'Too many attempts. Request a new code.' },

  TRADE_LIVE_PRICE_UNAVAILABLE: { ar: 'أسعار السوق غير متاحة حالياً. حاول مرة أخرى خلال لحظات.', en: 'Market prices unavailable. Try again shortly.' },
  TRADE_AMOUNT_OUT_OF_RANGE: { ar: 'المبلغ خارج النطاق المسموح', en: 'Amount out of allowed range' },

  P2P_OFFER_NOT_FOUND: { ar: 'الإعلان غير موجود', en: 'P2P offer not found' },
  P2P_OFFER_NOT_ACTIVE: { ar: 'الإعلان غير نشط', en: 'P2P offer is not active' },
  P2P_CANNOT_TRADE_SELF: { ar: 'لا يمكنك التداول مع نفسك', en: 'Cannot trade with yourself' },
  P2P_RELEASE_REQUIRES_PAID: { ar: 'لا يمكن الإفراج قبل تأكيد المشتري للدفع', en: 'Cannot release before buyer confirms payment' },

  DEPOSIT_ALREADY_PROCESSED: { ar: 'تمت معالجة هذا الطلب مسبقاً', en: 'This deposit has already been processed' },
  WITHDRAWAL_INSUFFICIENT_BALANCE: { ar: 'رصيد الجنيه غير كافٍ', en: 'Insufficient EGP balance for withdrawal' },

  DISPUTE_ALREADY_RESOLVED: { ar: 'النزاع تم حله مسبقاً', en: 'Dispute has already been resolved' },

  SESSION_EXPIRED: { ar: 'انتهت الجلسة. سجّل الدخول مرة أخرى.', en: 'Session expired. Please log in again.' },
  CONFIG_MISSING_SECRETS: { ar: 'إعداد غير مكتمل: راجع متغيرات البيئة', en: 'Configuration incomplete: check environment variables' },
}

/**
 * Translate an error key to the user's preferred language.
 * Defaults to Arabic (the app's primary language).
 *
 * To support per-user language, pass the user's `language` from UserSettings.
 * For now, we default to Arabic — the frontend can localize further if needed.
 */
export function t(key: ErrorKey, lang: 'ar' | 'en' = 'ar'): string {
  return MESSAGES[key]?.[lang] || MESSAGES[key]?.ar || key
}

/**
 * Get the full message object (both languages) — useful for endpoints that
 * want to return both or let the client choose.
 */
export function getMessage(key: ErrorKey): { ar: string; en: string } {
  return MESSAGES[key] || { ar: key, en: key }
}
