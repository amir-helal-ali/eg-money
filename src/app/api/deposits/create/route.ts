import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'
import { requireVerified } from '@/lib/verify-guard'
import { assignPaymentWallet } from '@/lib/payment-assigner'
import { createNotification } from '@/lib/notifications'
import { DepositCreateSchema, parseBody } from '@/lib/schemas'

/**
 * POST /api/deposits/create
 * Smart deposit creation with payment wallet assignment.
 *
 * Body: { amountEgp: number, method: string, currency: string }
 * Returns: { deposit, wallet } — the wallet to send money to
 *
 * The user then sends money to the assigned wallet number,
 * uploads a receipt, and submits the final deposit via /api/deposits (POST).
 */
export async function POST(req: NextRequest) {
  try {
    const verifyError = await requireVerified(req)
    if (verifyError) return verifyError

    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    // ===== Zod validation =====
    const parsed = parseBody(DepositCreateSchema, body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }
    const { amountEgp: amount, method, currency } = parsed.data

    // Min deposit check (configurable via Settings)
    const settings = await (await import('@/lib/money')).getSettings()
    if (amount < settings.minDepositEgp) {
      return NextResponse.json(
        { error: `أقل مبلغ للإيداع هو ${settings.minDepositEgp} جنيه` },
        { status: 400 },
      )
    }

    // Smart wallet assignment
    const { wallet, error: walletError } = await assignPaymentWallet(method, amount)
    if (walletError || !wallet) {
      return NextResponse.json({ error: walletError || 'لا توجد محفظة متاحة' }, { status: 503 })
    }

    // Create the deposit record with assigned wallet
    const deposit = await db.deposit.create({
      data: {
        userId: user.id,
        amountEgp: amount,
        method,
        currency: currency || 'EGP',
        assignedWalletId: wallet.id,
        status: 'PENDING_PAYMENT', // new status: waiting for user to send money + upload receipt
      },
    })

    // Notify admins
    const admins = await db.user.findMany({ where: { role: 'ADMIN', status: 'ACTIVE' } })
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'DEPOSIT',
        title: '📥 طلب إيداع جديد',
        message: `${user.name || user.email} بدأ إيداع ${amount} EGP عبر ${method}. المحفظة: ${wallet.number}. بانتظار إثبات الدفع.`,
        metadata: { depositId: deposit.id, amount, method, walletId: wallet.id, action: 'admin_deposits' },
      })
    }

    return NextResponse.json({
      deposit: {
        id: deposit.id,
        amountEgp: amount,
        method,
        currency: deposit.currency,
        status: deposit.status,
        createdAt: deposit.createdAt,
      },
      wallet: {
        id: wallet.id,
        method: wallet.method,
        number: wallet.number,
        holderName: wallet.holderName,
        label: wallet.label,
        dailyLimit: wallet.dailyLimit,
        monthlyLimit: wallet.monthlyLimit,
        remainingDaily: wallet.remainingDaily,
        remainingMonthly: wallet.remainingMonthly,
      },
      message: 'تم اختيار محفظة الدفع. حوّل المبلغ ثم ارفع إثبات الدفع.',
    })
  } catch (e) {
    console.error('Deposit create error:', e)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}
