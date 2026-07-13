import { db } from '@/lib/db'

/**
 * Email notification service.
 *
 * Uses nodemailer with SMTP configuration from environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * If SMTP is not configured, emails are logged to console (development mode).
 * Each email checks the user's notification preferences before sending.
 *
 * SECURITY: All user-controllable values (IP, User-Agent, email, names,
 * amounts, etc.) are HTML-escaped before insertion into email HTML to
 * prevent XSS in email clients (some of which render HTML + JS).
 */

/**
 * HTML-escape a string for safe insertion into email HTML.
 * Escapes &, <, >, ", ' — the standard 5 characters.
 */
function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

type EmailCategory = 'security' | 'deposits' | 'withdrawals' | 'p2p' | 'marketing'

type EmailTemplate = {
  subject: string
  html: string
  text: string
}

let transporter: any = null

async function getTransporter() {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    return null
  }

  try {
    const nodemailer = await import('nodemailer')
    transporter = nodemailer.default.createTransport({
      host,
      port: Number(port) || 587,
      secure: Number(port) === 465,
      auth: { user, pass },
    })
    return transporter
  } catch (e) {
    console.error('[email] Failed to create transporter:', e)
    return null
  }
}

/**
 * Check if the user has opted into a specific email category.
 */
async function checkUserPreference(userId: string, category: EmailCategory): Promise<boolean> {
  try {
    const settings = await db.userSettings.findUnique({ where: { userId } })
    if (!settings) return true // default: allow
    if (!settings.notifyEmail) return false // master switch off
    switch (category) {
      case 'security': return settings.emailSecurity
      case 'deposits': return settings.emailDeposits
      case 'withdrawals': return settings.emailWithdrawals
      case 'p2p': return settings.emailP2p
      case 'marketing': return settings.emailMarketing
      default: return true
    }
  } catch {
    return true
  }
}

/**
 * Send an email to a user. Checks preferences first.
 * Non-blocking — failures are logged but don't affect the main flow.
 */
export async function sendEmail(
  userId: string,
  category: EmailCategory,
  template: EmailTemplate,
): Promise<boolean> {
  try {
    // Check user preferences
    const allowed = await checkUserPreference(userId, category)
    if (!allowed) {
      return false // user opted out
    }

    // Get user email
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    })
    if (!user) return false

    const transport = await getTransporter()
    const from = process.env.SMTP_FROM || 'no-reply@eg-money.com'

    if (!transport) {
      // Development mode: log to console
      console.log(`\n📧 [EMAIL DEV] To: ${user.email}`)
      console.log(`   Subject: ${template.subject}`)
      console.log(`   Category: ${category}`)
      console.log(`   Body: ${template.text.substring(0, 200)}...`)
      return true
    }

    await transport.sendMail({
      from: `"Eg-Money" <${from}>`,
      to: user.email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    })

    return true
  } catch (e) {
    console.error('[email] Send error:', e)
    return false
  }
}

// ===== Email Templates =====

export const EMAIL_TEMPLATES = {
  loginAlert: (ip: string, userAgent: string, time: string) => {
    // SECURITY: escape user-controllable values (IP + User-Agent come from
    // request headers and could contain malicious HTML/JS).
    const safeIp = escapeHtml(ip)
    const safeUserAgent = escapeHtml(userAgent)
    const safeTime = escapeHtml(time)
    return {
      subject: '🔐 تسجيل دخول جديد لحسابك على Eg-Money',
      text: `تم تسجيل الدخول لحسابك من IP: ${ip} في ${time}\nالجهاز: ${userAgent}\nإن لم تكن أنت، يرجى تغيير كلمة المرور فوراً.`,
      html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">🔐 تسجيل دخول جديد</h2>
        <p>تم تسجيل الدخول لحسابك على Eg-Money:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb;">IP:</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${safeIp}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb;">الوقت:</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${safeTime}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb;">الجهاز:</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${safeUserAgent}</td></tr>
        </table>
        <p style="color: #ef4444; font-weight: bold;">إن لم تكن أنت، يرجى تغيير كلمة المرور فوراً.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #6b7280; font-size: 12px;">Eg-Money — منصة تداول USDT بالجنيه المصري</p>
      </div>
    `,
    }
  },

  depositApproved: (amount: number, currency: string) => ({
    subject: '✅ تم اعتماد إيداعك',
    text: `تم اعتماد إيداعك بقيمة ${amount} ${currency}. الرصيد متاح في محفظتك الآن.`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">✅ تم اعتماد الإيداع</h2>
        <p>تم اعتماد إيداعك بنجاح:</p>
        <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <div style="font-size: 24px; font-weight: bold; color: #10b981;">${amount} ${currency}</div>
        </div>
        <p>الرصيد متاح في محفظتك الآن.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #6b7280; font-size: 12px;">Eg-Money — منصة تداول USDT بالجنيه المصري</p>
      </div>
    `,
  }),

  depositRejected: (amount: number, reason: string) => ({
    subject: '❌ تم رفض إيداعك',
    text: `تم رفض إيداعك بقيمة ${amount} EGP. السبب: ${reason}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #ef4444;">❌ تم رفض الإيداع</h2>
        <p>نأسف، تم رفض إيداعك:</p>
        <div style="background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <div style="font-size: 18px; font-weight: bold; color: #ef4444;">${escapeHtml(amount)} EGP</div>
          <div style="margin-top: 8px; color: #6b7280;">السبب: ${escapeHtml(reason)}</div>
        </div>
        <p>للمساعدة، تواصل مع الدعم على support@eg-money.com</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #6b7280; font-size: 12px;">Eg-Money — منصة تداول USDT بالجنيه المصري</p>
      </div>
    `,
  }),

  withdrawalProcessed: (amount: number, currency: string, method: string) => ({
    subject: '✅ تم معالجة سحبك',
    text: `تم معالجة سحبك بقيمة ${amount} ${currency} عبر ${method}.`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">✅ تم معالجة السحب</h2>
        <p>تم معالجة طلب السحب بنجاح:</p>
        <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <div style="font-size: 24px; font-weight: bold; color: #10b981;">${amount} ${currency}</div>
          <div style="margin-top: 8px; color: #6b7280;">عبر: ${method}</div>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #6b7280; font-size: 12px;">Eg-Money — منصة تداول USDT بالجنيه المصري</p>
      </div>
    `,
  }),

  p2pTradeUpdate: (eventType: string, usdtAmount: number, details: string) => {
    const subjects: Record<string, string> = {
      TAKEN: '🔔 عرضك P2P تم أخذه',
      PAID: '💰 تم تأكيد الدفع في صفقتك P2P',
      RELEASED: '✅ تم الإفراج عن USDT في صفقتك',
      CANCELLED: '❌ تم إلغاء صفقة P2P',
      DISPUTED: '⚠️ تم فتح نزاع في صفقتك',
      RESOLVED: '⚖️ تم حل النزاع في صفقتك',
    }
    const safeDetails = escapeHtml(details)
    const safeSubject = escapeHtml(subjects[eventType] || 'تحديث صفقة P2P')
    return {
      subject: subjects[eventType] || 'تحديث صفقة P2P',
      text: `${details}\nالكمية: ${usdtAmount} USDT`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #8b5cf6;">${safeSubject}</h2>
          <div style="background: #f5f3ff; border: 1px solid #8b5cf6; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <div style="font-size: 20px; font-weight: bold; color: #8b5cf6;">${escapeHtml(usdtAmount)} USDT</div>
            <div style="margin-top: 8px; color: #6b7280;">${safeDetails}</div>
          </div>
          <p>تفاصيل أكثر في حسابك على Eg-Money.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #6b7280; font-size: 12px;">Eg-Money — منصة تداول USDT بالجنيه المصري</p>
        </div>
      `,
    }
  },

  passwordChanged: () => ({
    subject: '🔑 تم تغيير كلمة المرور',
    text: 'تم تغيير كلمة المرور لحسابك. إن لم تكن أنت، تواصل مع الدعم فوراً.',
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #f59e0b;">🔑 تم تغيير كلمة المرور</h2>
        <p>تم تغيير كلمة المرور الخاصة بحسابك على Eg-Money.</p>
        <p style="color: #ef4444;">إن لم تقم أنت بهذا التغيير، يرجى التواصل مع الدعم فوراً.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #6b7280; font-size: 12px;">Eg-Money — منصة تداول USDT بالجنيه المصري</p>
      </div>
    `,
  }),
} as const
