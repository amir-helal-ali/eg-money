import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'
import { requireVerified } from '@/lib/verify-guard'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const deposits = await db.deposit.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({
    deposits: deposits.map((d) => ({
      id: d.id,
      amountEgp: Number(d.amountEgp),
      method: d.method,
      reference: d.reference,
      status: d.status,
      adminNote: d.adminNote,
      createdAt: d.createdAt,
      processedAt: d.processedAt,
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
    const { amountEgp, method, reference } = body

    if (!amountEgp || !method) {
      return NextResponse.json(
        { error: 'المبلغ وطريقة الإيداع مطلوبان' },
        { status: 400 },
      )
    }

    const amount = Number(amountEgp)
    if (!isFinite(amount) || amount < 100) {
      return NextResponse.json(
        { error: 'أقل مبلغ للإيداع هو 100 جنيه' },
        { status: 400 },
      )
    }

    const validMethods = ['VODAFONE_CASH', 'INSTAPAY', 'FAWRY', 'BANK_TRANSFER']
    if (!validMethods.includes(method)) {
      return NextResponse.json(
        { error: 'طريقة إيداع غير صحيحة' },
        { status: 400 },
      )
    }

    const deposit = await db.deposit.create({
      data: {
        userId: user.id,
        amountEgp: amount,
        method,
        reference: reference || null,
      },
    })

    // Create real notification for the user
    const { createNotification } = await import('@/lib/notifications')
    await createNotification({
      userId: user.id,
      type: 'DEPOSIT',
      title: 'طلب إيداع قيد المراجعة',
      message: `تم استلام طلب إيداع بمبلغ ${amount} EGP عبر ${method}. سيتم اعتماده خلال دقائق.`,
      metadata: { depositId: deposit.id, amount, method, action: 'view_wallet' },
    })

    // Notify ALL admins about the new deposit request
    const admins = await db.user.findMany({ where: { role: 'ADMIN', status: 'ACTIVE' } })
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'DEPOSIT',
        title: '📥 طلب إيداع جديد',
        message: `طلب إيداع ${amount} EGP من ${user.name || user.email} عبر ${method}. بانتظار المراجعة.`,
        metadata: { depositId: deposit.id, amount, method, userId: user.id, action: 'admin_deposits' },
      })
    }

    return NextResponse.json({
      deposit: {
        id: deposit.id,
        amountEgp: Number(deposit.amountEgp),
        method: deposit.method,
        reference: deposit.reference,
        status: deposit.status,
        createdAt: deposit.createdAt,
      },
      message: 'تم استلام طلب الإيداع. سيتم اعتماده خلال دقائق بعد التحقق.',
    })
  } catch (e) {
    console.error('Deposit error:', e)
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع' },
      { status: 500 },
    )
  }
}
