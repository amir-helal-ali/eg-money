import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/session'

// GET /api/admin/users/[id] — full user details for admin
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      phone: true,
      countryCode: true,
      role: true,
      egpBalance: true,
      usdtBalance: true,
      status: true,
      emailVerified: true,
      phoneVerified: true,
      googleId: true,
      googleEmail: true,
      googleName: true,
      googleAvatar: true,
      referralCode: true,
      referredById: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          deposits: true,
          withdrawals: true,
          trades: true,
          p2pOffers: true,
          p2pTradesAsBuyer: true,
          p2pTradesAsSeller: true,
          transactions: true,
          notifications: true,
          priceAlerts: true,
        },
      },
    },
  })

  if (!user) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })

  // Fetch recent transactions (last 20)
  const recentTxns = await db.transaction.findMany({
    where: { userId: id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  // Fetch recent deposits (last 10)
  const recentDeposits = await db.deposit.findMany({
    where: { userId: id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  // Fetch recent withdrawals (last 10)
  const recentWithdrawals = await db.withdrawal.findMany({
    where: { userId: id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  // Fetch recent trades (last 10)
  const recentTrades = await db.trade.findMany({
    where: { userId: id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  // Find referrer if exists
  let referrer: { id: string; name: string | null; email: string; username: string } | null = null
  if (user.referredById) {
    const ref = await db.user.findUnique({
      where: { id: user.referredById },
      select: { id: true, name: true, email: true, username: true },
    })
    referrer = ref
  }

  // Count referrals made by this user
  const referralsCount = await db.referral.count({
    where: { referrerId: id },
  })

  return NextResponse.json({
    user: {
      ...user,
      egpBalance: Number(user.egpBalance),
      usdtBalance: Number(user.usdtBalance),
    },
    stats: {
      deposits: user._count.deposits,
      withdrawals: user._count.withdrawals,
      trades: user._count.trades,
      p2pOffers: user._count.p2pOffers,
      p2pBuyerTrades: user._count.p2pTradesAsBuyer,
      p2pSellerTrades: user._count.p2pTradesAsSeller,
      transactions: user._count.transactions,
      notifications: user._count.notifications,
      priceAlerts: user._count.priceAlerts,
      referrals: referralsCount,
    },
    referrer,
    recentTransactions: recentTxns.map((t) => ({
      id: t.id,
      type: t.type,
      direction: t.direction,
      currency: t.currency,
      amount: Number(t.amount),
      balanceAfter: Number(t.balanceAfter),
      description: t.description,
      createdAt: t.createdAt,
    })),
    recentDeposits: recentDeposits.map((d) => ({
      id: d.id,
      amountEgp: Number(d.amountEgp),
      method: d.method,
      status: d.status,
      senderNumber: d.senderNumber,
      receiptImage: d.receiptImage,
      createdAt: d.createdAt,
      processedAt: d.processedAt,
    })),
    recentWithdrawals: recentWithdrawals.map((w) => ({
      id: w.id,
      amountEgp: Number(w.amountEgp),
      method: w.method,
      destination: w.destination,
      status: w.status,
      createdAt: w.createdAt,
      processedAt: w.processedAt,
    })),
    recentTrades: recentTrades.map((t) => ({
      id: t.id,
      type: t.type,
      usdtAmount: Number(t.usdtAmount),
      egpAmount: Number(t.egpAmount),
      priceEgp: Number(t.priceEgp),
      feeEgp: Number(t.feeEgp),
      createdAt: t.createdAt,
    })),
  })
}

// PATCH /api/admin/users/[id] — update user status or verification
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const { action } = body

  // action: SUSPEND | ACTIVATE | VERIFY_EMAIL | VERIFY_PHONE | UNVERIFY_EMAIL | UNVERIFY_PHONE
  const user = await db.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
  if (user.role === 'ADMIN' && (action === 'SUSPEND' || action === 'UNVERIFY_EMAIL' || action === 'UNVERIFY_PHONE')) {
    return NextResponse.json({ error: 'لا يمكن تعديل حساب الأدمن' }, { status: 400 })
  }

  const data: any = {}
  if (action === 'SUSPEND') data.status = 'SUSPENDED'
  if (action === 'ACTIVATE') data.status = 'ACTIVE'
  if (action === 'VERIFY_EMAIL') data.emailVerified = true
  if (action === 'VERIFY_PHONE') data.phoneVerified = true
  if (action === 'UNVERIFY_EMAIL') data.emailVerified = false
  if (action === 'UNVERIFY_PHONE') data.phoneVerified = false

  await db.user.update({ where: { id }, data })
  return NextResponse.json({ success: true, message: 'تم التحديث' })
}
