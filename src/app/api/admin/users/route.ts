import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/session'

/**
 * GET /api/admin/users
 *
 * Paginated list of users (cursor-based on createdAt). Supports search by
 * email/username/name/phone.
 *
 * Query params:
 *   limit    (default 50, max 200)
 *   cursor   (createdAt of last item, ISO date)
 *   search   (substring match on email/username/name/phone)
 *   status   (ACTIVE | SUSPENDED)
 *   role     (USER | ADMIN)
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const url = new URL(req.url)
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 50), 1), 200)
  const cursor = url.searchParams.get('cursor')
  const search = url.searchParams.get('search')?.trim()
  const status = url.searchParams.get('status')
  const role = url.searchParams.get('role')

  const where: any = {}
  if (status) where.status = status
  if (role) where.role = role
  if (search) {
    where.OR = [
      { email: { contains: search } },
      { username: { contains: search } },
      { name: { contains: search } },
      { phone: { contains: search } },
    ]
  }
  if (cursor) {
    where.createdAt = { lt: new Date(cursor) }
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        phone: true,
        role: true,
        egpBalance: true,
        usdtBalance: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            deposits: true,
            withdrawals: true,
            trades: true,
            p2pTradesAsBuyer: true,
            p2pTradesAsSeller: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    db.user.count({ where: { ...where, createdAt: undefined } }),
  ])

  const hasNext = users.length === limit
  const nextCursor = hasNext && users.length > 0
    ? users[users.length - 1].createdAt.toISOString()
    : null

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      username: u.username,
      name: u.name,
      phone: u.phone,
      role: u.role,
      egpBalance: Number(u.egpBalance),
      usdtBalance: Number(u.usdtBalance),
      status: u.status,
      createdAt: u.createdAt,
      stats: {
        deposits: u._count.deposits,
        withdrawals: u._count.withdrawals,
        trades: u._count.trades,
        p2pBuyerTrades: u._count.p2pTradesAsBuyer,
        p2pSellerTrades: u._count.p2pTradesAsSeller,
      },
    })),
    pagination: {
      total,
      limit,
      hasNext,
      nextCursor,
      count: users.length,
    },
  })
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const body = await req.json()
    const { userId, action } = body
    // action: SUSPEND | ACTIVATE

    if (!userId || !action) {
      return NextResponse.json({ error: 'معرف المستخدم والإجراء مطلوبان' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    if (user.role === 'ADMIN') {
      return NextResponse.json({ error: 'لا يمكن تعديل حالة الأدمن' }, { status: 400 })
    }

    const newStatus = action === 'SUSPEND' ? 'SUSPENDED' : 'ACTIVE'
    await db.user.update({
      where: { id: userId },
      data: { status: newStatus },
    })

    return NextResponse.json({
      success: true,
      message: action === 'SUSPEND' ? 'تم إيقاف الحساب' : 'تم تفعيل الحساب',
    })
  } catch (e) {
    console.error('Admin user patch error:', e)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
