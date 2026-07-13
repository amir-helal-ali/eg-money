import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/session'
import { creditEgp } from '@/lib/money'
import { createNotification } from '@/lib/notifications'
import { pushBalanceUpdate } from '@/lib/balance-sync'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const url = new URL(req.url)
  const status = url.searchParams.get('status') || 'PENDING'

  const where: any = {}
  if (status !== 'ALL') where.status = status

  const withdrawals = await db.withdrawal.findMany({
    where,
    include: {
      user: { select: { id: true, email: true, name: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return NextResponse.json({
    withdrawals: withdrawals.map((w) => ({
      id: w.id,
      amountEgp: Number(w.amountEgp),
      method: w.method,
      destination: w.destination,
      status: w.status,
      adminNote: w.adminNote,
      createdAt: w.createdAt,
      processedAt: w.processedAt,
      user: w.user,
    })),
  })
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const body = await req.json()
    const { withdrawalId, action, adminNote } = body
    // action: APPROVE | REJECT

    if (!withdrawalId || !action) {
      return NextResponse.json({ error: 'معرف الطلب والإجراء مطلوبان' }, { status: 400 })
    }

    const withdrawal = await db.withdrawal.findUnique({ where: { id: withdrawalId } })
    if (!withdrawal) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
    if (withdrawal.status !== 'PENDING') {
      return NextResponse.json({ error: 'تمت معالجة هذا الطلب مسبقاً' }, { status: 400 })
    }

    if (action === 'APPROVE') {
      // EGP was already debited when the request was created, just mark as approved
      await db.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'APPROVED',
          adminNote: adminNote || null,
          processedById: admin.id,
          processedAt: new Date(),
        },
      })

      // Notify user their withdrawal was approved
      await createNotification({
        userId: withdrawal.userId,
        type: 'WITHDRAWAL',
        title: '✅ تم اعتماد طلب السحب',
        message: `تم اعتماد طلب سحب ${Number(withdrawal.amountEgp)} جنيه عبر ${withdrawal.method} إلى ${withdrawal.destination}. سيصلك المبلغ خلال 24 ساعة.`,
        metadata: {
          withdrawalId: withdrawal.id,
          amount: Number(withdrawal.amountEgp),
          method: withdrawal.method,
          action: 'APPROVED',
        },
      })

      // Push real-time balance update (user's balance didn't change on approve,
      // but we push to refresh the UI state)
      await pushBalanceUpdate(withdrawal.userId)

      return NextResponse.json({ success: true, message: 'تم اعتماد السحب' })
    }

    if (action === 'REJECT') {
      // Refund the EGP that was held
      await creditEgp(
        withdrawal.userId,
        Number(withdrawal.amountEgp),
        'WITHDRAWAL',
        `استرجاع مبلغ سحب مرفوض`,
        withdrawal.id,
        'WITHDRAWAL_REFUND',
      )
      await db.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'REJECTED',
          adminNote: adminNote || null,
          processedById: admin.id,
          processedAt: new Date(),
        },
      })

      // Notify user their withdrawal was rejected + refunded
      await createNotification({
        userId: withdrawal.userId,
        type: 'WITHDRAWAL',
        title: '❌ تم رفض طلب السحب',
        message: `تم رفض طلب سحب ${Number(withdrawal.amountEgp)} جنيه. تم استرجاع المبلغ لرصيدك.${adminNote ? ` السبب: ${adminNote}` : ''}`,
        metadata: {
          withdrawalId: withdrawal.id,
          amount: Number(withdrawal.amountEgp),
          action: 'REJECTED',
          refund: true,
        },
      })

      // Push real-time balance update (EGP was refunded)
      await pushBalanceUpdate(withdrawal.userId)

      return NextResponse.json({ success: true, message: 'تم رفض السحب واسترجاع المبلغ' })
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 })
  } catch (e) {
    console.error('Admin withdrawal patch error:', e)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
