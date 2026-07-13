import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/session'

// GET /api/admin/overview — aggregated platform stats for admin dashboard
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Run all counts in parallel
  const [
    totalUsers, activeUsers, suspendedUsers, adminCount,
    pendingDeposits, pendingWithdrawals, approvedDeposits, approvedWithdrawals,
    totalTrades, todayTrades, monthTrades,
    totalP2pTrades, pendingP2pTrades, completedP2pTrades,
    activeP2pOffers,
    totalTransactions,
    unverifiedEmailCount, unverifiedPhoneCount,
    totalDeposits, totalWithdrawals, totalFees,
    todayDeposits, todayWithdrawals, todayFees,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { status: 'ACTIVE' } }),
    db.user.count({ where: { status: 'SUSPENDED' } }),
    db.user.count({ where: { role: 'ADMIN' } }),
    db.deposit.count({ where: { status: { in: ['PENDING', 'PENDING_PAYMENT'] } } }),
    db.withdrawal.count({ where: { status: 'PENDING' } }),
    db.deposit.count({ where: { status: 'APPROVED' } }),
    db.withdrawal.count({ where: { status: 'APPROVED' } }),
    db.trade.count(),
    db.trade.count({ where: { createdAt: { gte: todayStart } } }),
    db.trade.count({ where: { createdAt: { gte: monthStart } } }),
    db.p2pTrade.count(),
    db.p2pTrade.count({ where: { status: { in: ['PENDING_PAYMENT', 'PAID'] } } }),
    db.p2pTrade.count({ where: { status: 'RELEASED' } }),
    db.p2pOffer.count({ where: { status: 'ACTIVE' } }),
    db.transaction.count(),
    db.user.count({ where: { emailVerified: false } }),
    db.user.count({ where: { phoneVerified: false, phone: { not: null } } }),
    // Sums for deposits
    db.deposit.aggregate({ _sum: { amountEgp: true }, where: { status: 'APPROVED' } }),
    db.withdrawal.aggregate({ _sum: { amountEgp: true }, where: { status: 'APPROVED' } }),
    db.trade.aggregate({ _sum: { feeEgp: true } }),
    // Today's sums
    db.deposit.aggregate({ _sum: { amountEgp: true }, where: { status: 'APPROVED', processedAt: { gte: todayStart } } }),
    db.withdrawal.aggregate({ _sum: { amountEgp: true }, where: { status: 'APPROVED', processedAt: { gte: todayStart } } }),
    db.trade.aggregate({ _sum: { feeEgp: true }, where: { createdAt: { gte: todayStart } } }),
  ])

  // Total balances held
  const balances = await db.user.aggregate({
    _sum: { egpBalance: true, usdtBalance: true },
  })

  return NextResponse.json({
    users: {
      total: totalUsers,
      active: activeUsers,
      suspended: suspendedUsers,
      admins: adminCount,
      unverifiedEmail: unverifiedEmailCount,
      unverifiedPhone: unverifiedPhoneCount,
    },
    deposits: {
      pending: pendingDeposits,
      approved: approvedDeposits,
      totalAmountEgp: Number(totalDeposits._sum.amountEgp || 0),
      todayAmountEgp: Number(todayDeposits._sum.amountEgp || 0),
    },
    withdrawals: {
      pending: pendingWithdrawals,
      approved: approvedWithdrawals,
      totalAmountEgp: Number(totalWithdrawals._sum.amountEgp || 0),
      todayAmountEgp: Number(todayWithdrawals._sum.amountEgp || 0),
    },
    trades: {
      total: totalTrades,
      today: todayTrades,
      thisMonth: monthTrades,
      totalFeesEgp: Number(totalFees._sum.feeEgp || 0),
      todayFeesEgp: Number(todayFees._sum.feeEgp || 0),
    },
    p2p: {
      totalTrades: totalP2pTrades,
      pendingTrades: pendingP2pTrades,
      completedTrades: completedP2pTrades,
      activeOffers: activeP2pOffers,
    },
    balances: {
      totalEgpHeld: Number(balances._sum.egpBalance || 0),
      totalUsdtHeld: Number(balances._sum.usdtBalance || 0),
    },
    transactions: {
      total: totalTransactions,
    },
  })
}
