import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/session'

// GET — list all payment wallets
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const wallets = await db.paymentWallet.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })

  return NextResponse.json({
    wallets: wallets.map((w) => ({
      id: w.id,
      method: w.method,
      number: w.number,
      holderName: w.holderName || '',
      label: w.label || '',
      active: w.active,
      sortOrder: w.sortOrder,
      todayTotalEgp: Number(w.todayTotalEgp),
      monthTotalEgp: Number(w.monthTotalEgp),
      lastResetDate: w.lastResetDate,
      lastResetMonth: w.lastResetMonth,
    })),
  })
}

// POST — create a new payment wallet
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await req.json()
  const { method, number, holderName, label, sortOrder } = body

  if (!method || !number) {
    return NextResponse.json({ error: 'الطريقة والرقم مطلوبان' }, { status: 400 })
  }

  const validMethods = ['VODAFONE_CASH', 'INSTAPAY', 'FAWRY', 'BANK_TRANSFER']
  if (!validMethods.includes(method)) {
    return NextResponse.json({ error: 'طريقة دفع غير صحيحة' }, { status: 400 })
  }

  const wallet = await db.paymentWallet.create({
    data: {
      method,
      number: String(number).trim(),
      holderName: holderName || null,
      label: label || null,
      sortOrder: Number(sortOrder) || 0,
    },
  })

  return NextResponse.json({ success: true, wallet })
}

// PATCH — update a payment wallet
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await req.json()
  const { id, method, number, holderName, label, active, sortOrder, resetLimits } = body

  if (!id) {
    return NextResponse.json({ error: 'معرف المحفظة مطلوب' }, { status: 400 })
  }

  const data: any = {}
  if (method !== undefined) data.method = method
  if (number !== undefined) data.number = String(number).trim()
  if (holderName !== undefined) data.holderName = holderName || null
  if (label !== undefined) data.label = label || null
  if (active !== undefined) data.active = !!active
  if (sortOrder !== undefined) data.sortOrder = Number(sortOrder) || 0
  if (resetLimits) {
    data.todayTotalEgp = 0
    data.monthTotalEgp = 0
    data.lastResetDate = new Date()
    data.lastResetMonth = new Date()
  }

  await db.paymentWallet.update({ where: { id }, data })
  return NextResponse.json({ success: true })
}

// DELETE — delete a payment wallet
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'معرف المحفظة مطلوب' }, { status: 400 })

  await db.paymentWallet.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
