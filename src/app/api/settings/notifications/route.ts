import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'

// GET /api/settings/notifications — fetch the current user's notification preferences
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const settings = await db.userSettings.findUnique({ where: { userId: user.id } })

  // Return defaults if no settings row exists yet
  const defaults = {
    notifyEmail: true,
    notifyPush: true,
    emailSecurity: true,
    emailDeposits: true,
    emailWithdrawals: true,
    emailP2p: true,
    emailMarketing: false,
    pushSecurity: true,
    pushDeposits: true,
    pushWithdrawals: true,
    pushP2p: true,
  }

  return NextResponse.json({
    preferences: settings ? {
      notifyEmail: settings.notifyEmail,
      notifyPush: settings.notifyPush,
      emailSecurity: settings.emailSecurity,
      emailDeposits: settings.emailDeposits,
      emailWithdrawals: settings.emailWithdrawals,
      emailP2p: settings.emailP2p,
      emailMarketing: settings.emailMarketing,
      pushSecurity: settings.pushSecurity,
      pushDeposits: settings.pushDeposits,
      pushWithdrawals: settings.pushWithdrawals,
      pushP2p: settings.pushP2p,
    } : defaults,
  })
}

// PATCH /api/settings/notifications — update notification preferences
// Body: partial object with any of the preference fields
export async function PATCH(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const allowedFields = [
    'notifyEmail', 'notifyPush',
    'emailSecurity', 'emailDeposits', 'emailWithdrawals', 'emailP2p', 'emailMarketing',
    'pushSecurity', 'pushDeposits', 'pushWithdrawals', 'pushP2p',
  ]

  const updates: any = {}
  for (const field of allowedFields) {
    if (typeof body[field] === 'boolean') {
      updates[field] = body[field]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'لا توجد تعديلات صالحة' }, { status: 400 })
  }

  // Upsert: create settings row if it doesn't exist
  const updated = await db.userSettings.upsert({
    where: { userId: user.id },
    update: updates,
    create: {
      userId: user.id,
      ...updates,
    },
  })

  return NextResponse.json({
    success: true,
    preferences: {
      notifyEmail: updated.notifyEmail,
      notifyPush: updated.notifyPush,
      emailSecurity: updated.emailSecurity,
      emailDeposits: updated.emailDeposits,
      emailWithdrawals: updated.emailWithdrawals,
      emailP2p: updated.emailP2p,
      emailMarketing: updated.emailMarketing,
      pushSecurity: updated.pushSecurity,
      pushDeposits: updated.pushDeposits,
      pushWithdrawals: updated.pushWithdrawals,
      pushP2p: updated.pushP2p,
    },
    message: 'تم تحديث تفضيلات الإشعارات',
  })
}
