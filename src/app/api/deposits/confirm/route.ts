import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'
import { createNotification } from '@/lib/notifications'

/**
 * POST /api/deposits/confirm
 * User submits the receipt + sender number after sending money.
 *
 * Body: { depositId: string, senderNumber: string, receiptImage: string (base64) }
 * The deposit status changes from PENDING_PAYMENT → PENDING (awaiting admin approval)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { depositId, senderNumber, receiptImage } = body

    if (!depositId || !senderNumber) {
      return NextResponse.json({ error: 'معرف الإيداع ورقم المرسل مطلوبان' }, { status: 400 })
    }

    const deposit = await db.deposit.findUnique({ where: { id: depositId } })
    if (!deposit) {
      return NextResponse.json({ error: 'الإيداع غير موجود' }, { status: 404 })
    }
    if (deposit.userId !== user.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }
    if (deposit.status !== 'PENDING_PAYMENT') {
      return NextResponse.json({ error: 'هذا الإيداع ليس قيد الانتظار' }, { status: 400 })
    }

    // Save receipt image if provided (base64 → save to /uploads/ OUTSIDE public/)
    // SECURITY: Receipts contain PII (sender name, account numbers, phone).
    // They must NOT be served as static files from /public/. Instead, they're
    // stored in /uploads/ and served via /api/uploads/[id] which authenticates
    // the requester (deposit owner or admin).
    let receiptPath: string | null = null
    if (receiptImage && typeof receiptImage === 'string' && receiptImage.length > 100) {
      try {
        const base64Data = receiptImage.replace(/^data:image\/\w+;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')
        const filename = `receipt-${depositId}-${Date.now()}.png`
        const fs = await import('fs')
        const path = await import('path')
        // Store OUTSIDE /public/ — accessible only via authenticated API route
        const uploadDir = path.join(process.cwd(), 'uploads', 'receipts')
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true })
        }
        fs.writeFileSync(path.join(uploadDir, filename), buffer)
        // Store the relative path (used by /api/uploads/receipts/[filename])
        receiptPath = `/api/uploads/receipts/${filename}`
      } catch (e) {
        console.error('Receipt upload error:', e)
      }
    }

    // Update deposit with sender number + receipt + change status
    await db.deposit.update({
      where: { id: depositId },
      data: {
        senderNumber,
        receiptImage: receiptPath,
        reference: senderNumber, // also store as reference for backwards compat
        status: 'PENDING', // now waiting for admin approval
      },
    })

    // Notify admins that deposit proof is submitted
    const admins = await db.user.findMany({ where: { role: 'ADMIN', status: 'ACTIVE' } })
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'DEPOSIT',
        title: '📋 إثبات إيداع جاهز للمراجعة',
        message: `${user.name || user.email} رفع إثبات دفع لإيداع ${Number(deposit.amountEgp)} EGP. رقم المرسل: ${senderNumber}.`,
        metadata: { depositId, amount: Number(deposit.amountEgp), senderNumber, action: 'admin_deposits' },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'تم رفع إثبات الدفع. سيتم مراجعة طلبك خلال دقائق.',
    })
  } catch (e) {
    console.error('Deposit confirm error:', e)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}
