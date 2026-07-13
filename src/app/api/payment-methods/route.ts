import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, requireAdmin } from '@/lib/session'

// GET — public: returns all active payment methods (for landing page + P2P)
// GET with admin auth: returns ALL payment methods (including inactive)
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  const isAdmin = user?.role === 'ADMIN'

  const where = isAdmin ? {} : { active: true }
  const methods = await db.paymentMethod.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
  })

  // If no methods in DB yet, seed defaults
  if (methods.length === 0) {
    return NextResponse.json({ methods: [], seeded: false })
  }

  return NextResponse.json({
    methods: methods.map(m => ({
      id: m.id,
      name: m.name,
      nameAr: m.nameAr,
      icon: m.icon,
      logoUrl: m.logoUrl,
      type: m.type,
      active: m.active,
      sortOrder: m.sortOrder,
    })),
  })
}

// POST — admin only: create a new payment method
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await req.json()
  const { name, nameAr, icon, logoUrl, type, sortOrder } = body

  if (!name || !nameAr) {
    return NextResponse.json({ error: 'Name and Arabic name required' }, { status: 400 })
  }

  const method = await db.paymentMethod.create({
    data: {
      name,
      nameAr,
      icon: icon || '💳',
      logoUrl: logoUrl || null,
      type: type || 'WALLET',
      sortOrder: Number(sortOrder) || 0,
    },
  })

  return NextResponse.json({ method, message: 'Payment method created' })
}

// PATCH — admin only: update a payment method
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await req.json()
  const { id, name, nameAr, icon, logoUrl, type, active, sortOrder } = body

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const existing = await db.paymentMethod.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await db.paymentMethod.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(nameAr !== undefined && { nameAr }),
      ...(icon !== undefined && { icon }),
      ...(logoUrl !== undefined && { logoUrl }),
      ...(type !== undefined && { type }),
      ...(active !== undefined && { active }),
      ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
    },
  })

  return NextResponse.json({ method: updated, message: 'Updated' })
}

// DELETE — admin only: delete a payment method
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await db.paymentMethod.delete({ where: { id } })
  return NextResponse.json({ success: true, message: 'Deleted' })
}
