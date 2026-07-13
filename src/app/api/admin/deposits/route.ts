import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/session'
import { roundEgp } from '@/lib/money'
import { createNotification } from '@/lib/notifications'
import { pushBalanceUpdate } from '@/lib/balance-sync'

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const url = new URL(req.url)
    const status = url.searchParams.get('status') || 'PENDING'

    // When filtering PENDING, also include PENDING_PAYMENT (new smart deposits awaiting receipt)
    const where: any = {}
    if (status === 'PENDING') {
      where.status = { in: ['PENDING', 'PENDING_PAYMENT'] }
    } else if (status !== 'ALL') {
      where.status = status
    }

    const deposits = await db.deposit.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
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
      senderNumber: d.senderNumber,
      receiptImage: d.receiptImage,
      assignedWalletId: d.assignedWalletId,
      currency: d.currency,
      user: d.user,
    })),
  })
  } catch (e) {
    console.error('Admin deposits GET error:', e)
    return NextResponse.json({ error: 'حدث خطأ', deposits: [] }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const body = await req.json()
    const { depositId, action, adminNote } = body
    // action: APPROVE | REJECT

    if (!depositId || !action) {
      return NextResponse.json({ error: 'معرف الطلب والإجراء مطلوبان' }, { status: 400 })
    }

    if (action === 'APPROVE') {
      // ===== ATOMIC APPROVE =====
      // Use a conditional updateMany on { id, status: { in: PENDING_STATES } }
      // to guarantee only ONE admin can transition a deposit to APPROVED.
      // The credit + status update + log all happen in one transaction.
      // Two admins clicking simultaneously → only one succeeds, the other
      // gets count=0 and we return "already processed".
      let credited = false
      let depositUserId: string | null = null
      let depositAmount = 0

      try {
        const result = await db.$transaction(async (tx) => {
          // Conditional update: only succeed if status is still pending
          const updateResult = await tx.deposit.updateMany({
            where: {
              id: depositId,
              status: { in: ['PENDING', 'PENDING_PAYMENT'] },
            },
            data: {
              status: 'APPROVED',
              adminNote: adminNote || null,
              processedById: admin.id,
              processedAt: new Date(),
            },
          })
          if (updateResult.count === 0) {
            throw new Error('ALREADY_PROCESSED')
          }

          // Fetch the deposit to get userId + amount for the credit + notification
          const deposit = await tx.deposit.findUnique({ where: { id: depositId } })
          if (!deposit) throw new Error('NOT_FOUND')

          // Credit the user's EGP balance inside the same transaction
          const roundedAmount = roundEgp(Number(deposit.amountEgp))
          const user = await tx.user.findUnique({ where: { id: deposit.userId } })
          if (!user) throw new Error('USER_NOT_FOUND')
          const newBalance = roundEgp(Number(user.egpBalance) + roundedAmount)
          await tx.user.update({
            where: { id: deposit.userId },
            data: { egpBalance: newBalance },
          })
          await tx.transaction.create({
            data: {
              userId: deposit.userId,
              type: 'DEPOSIT',
              direction: 'CREDIT',
              currency: 'EGP',
              amount: roundedAmount,
              balanceAfter: newBalance,
              description: `اعتماد إيداع ${deposit.method} (${deposit.reference || '-'})`,
              referenceId: deposit.id,
              referenceType: 'DEPOSIT',
            },
          })

          return { userId: deposit.userId, amount: roundedAmount }
        })
        credited = true
        depositUserId = result.userId
        depositAmount = result.amount
      } catch (e: any) {
        if (e?.message === 'ALREADY_PROCESSED') {
          return NextResponse.json({ error: 'تمت معالجة هذا الطلب مسبقاً' }, { status: 400 })
        }
        if (e?.message === 'NOT_FOUND') {
          return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
        }
        throw e
      }

      // Notify user their deposit was approved (outside the transaction)
      if (credited && depositUserId) {
        await createNotification({
          userId: depositUserId,
          type: 'DEPOSIT',
          title: '✅ تم اعتماد إيداعك',
          message: `تم اعتماد إيداع بقيمة ${depositAmount} EGP وإضافته لرصيدك.`,
          metadata: { depositId, amount: depositAmount, status: 'APPROVED', action: 'view_wallet' },
        })
        // Push real-time balance update
        await pushBalanceUpdate(depositUserId)
      }
      return NextResponse.json({ success: true, message: 'تم اعتماد الإيداع وإضافة الرصيد' })
    }

    if (action === 'REJECT') {
      // ===== ATOMIC REJECT =====
      // Same conditional-update pattern to prevent double-rejection.
      let rejectedDeposit: { userId: string; amount: number; id: string } | null = null
      try {
        rejectedDeposit = await db.$transaction(async (tx) => {
          const updateResult = await tx.deposit.updateMany({
            where: {
              id: depositId,
              status: { in: ['PENDING', 'PENDING_PAYMENT'] },
            },
            data: {
              status: 'REJECTED',
              adminNote: adminNote || null,
              processedById: admin.id,
              processedAt: new Date(),
            },
          })
          if (updateResult.count === 0) {
            throw new Error('ALREADY_PROCESSED')
          }
          const deposit = await tx.deposit.findUnique({ where: { id: depositId } })
          if (!deposit) throw new Error('NOT_FOUND')
          return { userId: deposit.userId, amount: Number(deposit.amountEgp), id: deposit.id }
        })
      } catch (e: any) {
        if (e?.message === 'ALREADY_PROCESSED') {
          return NextResponse.json({ error: 'تمت معالجة هذا الطلب مسبقاً' }, { status: 400 })
        }
        if (e?.message === 'NOT_FOUND') {
          return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
        }
        throw e
      }

      if (rejectedDeposit) {
        await createNotification({
          userId: rejectedDeposit.userId,
          type: 'DEPOSIT',
          title: '❌ تم رفض إيداع',
          message: `تم رفض طلب إيداع بقيمة ${rejectedDeposit.amount} EGP. ${adminNote || 'تواصل مع الدعم للمزيد.'}`,
          metadata: { depositId: rejectedDeposit.id, amount: rejectedDeposit.amount, status: 'REJECTED' },
        })
      }
      return NextResponse.json({ success: true, message: 'تم رفض الإيداع' })
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 })
  } catch (e) {
    console.error('Admin deposit patch error:', e)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
