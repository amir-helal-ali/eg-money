import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/session'
import { creditEgp, debitEgp, creditUsdt, debitUsdt, roundEgp, roundUsdt } from '@/lib/money'
import { createNotification } from '@/lib/notifications'
import { pushBalanceUpdate } from '@/lib/balance-sync'

// POST /api/admin/adjust-balance
// Body: { userId: string, currency: 'EGP'|'USDT', direction: 'CREDIT'|'DEBIT', amount: number, note: string }
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const body = await req.json()
    const { userId, currency, direction, amount, note } = body

    if (!userId || !currency || !direction || !amount) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    const amt = Number(amount)
    if (!isFinite(amt) || amt <= 0) {
      return NextResponse.json({ error: 'المبلغ غير صحيح' }, { status: 400 })
    }

    const targetUser = await db.user.findUnique({ where: { id: userId } })
    if (!targetUser) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    if (targetUser.role === 'ADMIN') {
      return NextResponse.json({ error: 'لا يمكن تعديل رصيد الأدمن' }, { status: 400 })
    }

    const desc = `تعديل يدوي بواسطة الأدمن: ${note || 'بدون ملاحظة'}`

    if (currency === 'EGP') {
      if (direction === 'CREDIT') {
        await creditEgp(userId, roundEgp(amt), 'ADMIN_ADJUST', desc, undefined, 'ADMIN_ADJUST')
      } else {
        if (Number(targetUser.egpBalance) < amt) {
          return NextResponse.json({ error: 'رصيد المستخدم غير كافٍ' }, { status: 400 })
        }
        await debitEgp(userId, roundEgp(amt), 'ADMIN_ADJUST', desc, undefined, 'ADMIN_ADJUST')
      }
    } else {
      if (direction === 'CREDIT') {
        await creditUsdt(userId, roundUsdt(amt), 'ADMIN_ADJUST', desc, undefined, 'ADMIN_ADJUST')
      } else {
        if (Number(targetUser.usdtBalance) < amt) {
          return NextResponse.json({ error: 'رصيد المستخدم غير كافٍ' }, { status: 400 })
        }
        await debitUsdt(userId, roundUsdt(amt), 'ADMIN_ADJUST', desc, undefined, 'ADMIN_ADJUST')
      }
    }

    // Notify user
    await createNotification({
      userId,
      type: 'SYSTEM',
      title: direction === 'CREDIT' ? '💰 تعديل رصيد (إضافة)' : '💸 تعديل رصيد (خصم)',
      message: `${direction === 'CREDIT' ? 'تمت إضافة' : 'تم خصم'} ${amt} ${currency} ${note ? `— ${note}` : ''}`,
      metadata: { adminId: admin.id, currency, direction, amount: amt, action: 'view_wallet' },
    })

    // Push real-time balance update
    await pushBalanceUpdate(userId)

    return NextResponse.json({ success: true, message: 'تم تعديل الرصيد بنجاح' })
  } catch (e) {
    console.error('Adjust balance error:', e)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}
