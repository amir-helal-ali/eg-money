import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'
import { roundEgp, getSettings } from '@/lib/money'
import { requireVerified } from '@/lib/verify-guard'
import { createNotification } from '@/lib/notifications'
import { WithdrawalCreateSchema, parseBody } from '@/lib/schemas'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const withdrawals = await db.withdrawal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
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
    })),
  })
}

export async function POST(req: NextRequest) {
  try {
    const verifyError = await requireVerified(req)
    if (verifyError) return verifyError

    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    // ===== Zod validation =====
    const parsed = parseBody(WithdrawalCreateSchema, body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }
    const { amountEgp: amount, method, destination } = parsed.data

    // Min withdrawal check (configurable via Settings)
    const settings = await getSettings()
    if (amount < settings.minWithdrawalEgp) {
      return NextResponse.json(
        { error: `أقل مبلغ للسحب هو ${settings.minWithdrawalEgp} جنيه` },
        { status: 400 },
      )
    }

    // ===== ATOMIC WITHDRAWAL CREATION =====
    // The debit + withdrawal record + transaction log all happen in ONE
    // transaction. If any step fails, the user's balance is untouched.
    // The balance check happens INSIDE the transaction so concurrent
    // withdrawal requests can't both pass the check.
    let withdrawal: { id: string; amountEgp: any; method: string; destination: string; status: string; createdAt: Date } | null = null
    try {
      withdrawal = await db.$transaction(async (tx) => {
        // Fresh read inside transaction for accurate balance
        const freshUser = await tx.user.findUnique({ where: { id: user.id } })
        if (!freshUser) throw new Error('USER_NOT_FOUND')
        const currentEgp = Number(freshUser.egpBalance)
        if (currentEgp < amount) throw new Error('INSUFFICIENT_EGP_BALANCE')

        // Create the withdrawal record FIRST (so we have an ID for the tx log)
        const w = await tx.withdrawal.create({
          data: {
            userId: user.id,
            amountEgp: amount,
            method,
            destination,
          },
        })

        // Debit the user's EGP inside the same transaction
        const newBalance = roundEgp(currentEgp - amount)
        await tx.user.update({
          where: { id: user.id },
          data: { egpBalance: newBalance },
        })
        await tx.transaction.create({
          data: {
            userId: user.id,
            type: 'WITHDRAWAL',
            direction: 'DEBIT',
            currency: 'EGP',
            amount: roundEgp(amount),
            balanceAfter: newBalance,
            description: `حجز مبلغ سحب (${method})`,
            referenceId: w.id,
            referenceType: 'WITHDRAWAL_HOLD',
          },
        })

        return w
      })
    } catch (e: any) {
      if (e?.message === 'INSUFFICIENT_EGP_BALANCE') {
        return NextResponse.json(
          { error: 'رصيد الجنيه غير كافٍ' },
          { status: 400 },
        )
      }
      throw e
    }

    if (!withdrawal) {
      return NextResponse.json({ error: 'فشل إنشاء طلب السحب' }, { status: 500 })
    }

    // Create real notification for the user (outside transaction)
    await createNotification({
      userId: user.id,
      type: 'WITHDRAWAL',
      title: 'طلب سحب قيد المراجعة',
      message: `تم استلام طلب سحب بمبلغ ${amount} EGP عبر ${method}. سيتم التحويل خلال 24 ساعة.`,
      metadata: { withdrawalId: withdrawal.id, amount, method, action: 'view_wallet' },
    })

    // Notify ALL admins about the new withdrawal request
    const admins = await db.user.findMany({ where: { role: 'ADMIN', status: 'ACTIVE' } })
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'WITHDRAWAL',
        title: '📤 طلب سحب جديد',
        message: `طلب سحب ${amount} EGP من ${user.name || user.email} عبر ${method} إلى ${destination}. بانتظار المراجعة.`,
        metadata: { withdrawalId: withdrawal.id, amount, method, userId: user.id, action: 'admin_withdrawals' },
      })
    }

    return NextResponse.json({
      withdrawal: {
        id: withdrawal.id,
        amountEgp: Number(withdrawal.amountEgp),
        method: withdrawal.method,
        destination: withdrawal.destination,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
      },
      message: 'تم استلام طلب السحب وسيتم تحويله خلال 24 ساعة بعد المراجعة.',
    })
  } catch (e) {
    console.error('Withdrawal error:', e)
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع' },
      { status: 500 },
    )
  }
}
