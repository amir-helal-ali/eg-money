import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/session'
import { getSettings } from '@/lib/money'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const settings = await getSettings()
  return NextResponse.json({
    settings: {
      ...settings,
      googleOAuthEnabled: !!settings.googleOAuthEnabled,
      googleClientId: settings.googleClientId || '',
      googleClientSecret: settings.googleClientSecret ? '••••••••' : '',
      requireEmailVerification: !!settings.requireEmailVerification,
      requirePhoneVerification: !!settings.requirePhoneVerification,
      depositDailyLimitEgp: Number(settings.depositDailyLimitEgp),
      depositMonthlyLimitEgp: Number(settings.depositMonthlyLimitEgp),
    },
  })
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const body = await req.json()
    const data: any = {}

    // Numeric trading settings
    const numericKeys = [
      'buyPriceEgp', 'sellPriceEgp', 'minTradeEgp', 'maxTradeEgp',
      'minP2pEgp', 'maxP2pEgp', 'p2pFeePercent', 'platformFeePercent',
    ]
    for (const key of numericKeys) {
      if (body[key] !== undefined) {
        const val = Number(body[key])
        if (!isNaN(val) && val >= 0) data[key] = val
      }
    }

    // Google OAuth boolean / strings
    if (body.googleOAuthEnabled !== undefined) {
      data.googleOAuthEnabled = !!body.googleOAuthEnabled
    }
    if (body.googleClientId !== undefined) {
      data.googleClientId = String(body.googleClientId).trim() || null
    }
    if (body.googleClientSecret !== undefined) {
      const v = String(body.googleClientSecret)
      if (v && !v.startsWith('•••')) {
        data.googleClientSecret = v.trim()
      }
    }

    // Verification enforcement
    if (body.requireEmailVerification !== undefined) {
      data.requireEmailVerification = !!body.requireEmailVerification
    }
    if (body.requirePhoneVerification !== undefined) {
      data.requirePhoneVerification = !!body.requirePhoneVerification
    }

    // Deposit limits
    if (body.depositDailyLimitEgp !== undefined) {
      const val = Number(body.depositDailyLimitEgp)
      if (!isNaN(val) && val > 0) data.depositDailyLimitEgp = val
    }
    if (body.depositMonthlyLimitEgp !== undefined) {
      const val = Number(body.depositMonthlyLimitEgp)
      if (!isNaN(val) && val > 0) data.depositMonthlyLimitEgp = val
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات للتحديث' }, { status: 400 })
    }

    const existing = await db.settings.findFirst()
    if (!existing) {
      await db.settings.create({ data: { id: 'singleton', ...data } })
    } else {
      await db.settings.update({ where: { id: existing.id }, data })
    }

    return NextResponse.json({ success: true, message: 'تم تحديث الإعدادات' })
  } catch (e) {
    console.error('Admin settings patch error:', e)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
