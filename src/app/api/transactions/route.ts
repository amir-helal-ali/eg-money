import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'
import { rateLimitOr429 } from '@/lib/rate-limit'

// GET /api/transactions — list current user's transactions
// Query params:
//   limit       (default 50, max 200)
//   cursor      (createdAt of last item, for pagination)
//   type        (DEPOSIT | WITHDRAWAL | TRADE | P2P_TRADE | FEE)
//   direction   (CREDIT | DEBIT)
//   currency    (EGP | USDT)
//   startDate   (ISO date)
//   endDate     (ISO date)
//   search      (substring match on description)
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Anti-scraping rate limit: 60 req/min per user
  const rl = rateLimitOr429(user.id, 'transactions')
  if (rl) {
    return NextResponse.json({ error: rl.error }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } })
  }

  const url = new URL(req.url)
  const limit = Math.min(Number(url.searchParams.get('limit') || 50), 200)
  const cursor = url.searchParams.get('cursor') // ISO date string of last item's createdAt
  const type = url.searchParams.get('type')
  const direction = url.searchParams.get('direction')
  const currency = url.searchParams.get('currency')
  const startDate = url.searchParams.get('startDate')
  const endDate = url.searchParams.get('endDate')
  const search = url.searchParams.get('search')?.trim()

  const where: any = { userId: user.id }
  if (type) where.type = type
  if (direction) where.direction = direction
  if (currency) where.currency = currency
  if (search) {
    where.description = { contains: search }
  }
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = new Date(startDate)
    if (endDate) where.createdAt.lte = new Date(endDate)
  }

  // Cursor-based pagination: fetch items older than `cursor`
  if (cursor) {
    where.createdAt = { ...(where.createdAt || {}), lt: new Date(cursor) }
  }

  const [transactions, total] = await Promise.all([
    db.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    db.transaction.count({ where: { userId: user.id } }),
  ])

  // Aggregate stats by currency + direction using SQL-level aggregation.
  // Previously this fetched ALL user transactions into memory and summed in JS —
  // O(N) memory + CPU per request. Now it's 4 cheap aggregate queries (or 1
  // groupBy) that run entirely in the DB.
  const [egpCredits, egpDebits, usdtCredits, usdtDebits] = await Promise.all([
    db.transaction.aggregate({
      where: { userId: user.id, currency: 'EGP', direction: 'CREDIT' },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: { userId: user.id, currency: 'EGP', direction: 'DEBIT' },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: { userId: user.id, currency: 'USDT', direction: 'CREDIT' },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: { userId: user.id, currency: 'USDT', direction: 'DEBIT' },
      _sum: { amount: true },
    }),
  ])

  const egpCreditsTotal = Number(egpCredits._sum.amount || 0)
  const egpDebitsTotal = Number(egpDebits._sum.amount || 0)
  const usdtCreditsTotal = Number(usdtCredits._sum.amount || 0)
  const usdtDebitsTotal = Number(usdtDebits._sum.amount || 0)

  const stats = {
    egp: {
      credits: Math.round(egpCreditsTotal * 100) / 100,
      debits: Math.round(egpDebitsTotal * 100) / 100,
      net: Math.round((egpCreditsTotal - egpDebitsTotal) * 100) / 100,
    },
    usdt: {
      credits: Math.round(usdtCreditsTotal * 1000000) / 1000000,
      debits: Math.round(usdtDebitsTotal * 1000000) / 1000000,
      net: Math.round((usdtCreditsTotal - usdtDebitsTotal) * 1000000) / 1000000,
    },
  }

  // Determine if there are more results (next page exists)
  const hasNext = transactions.length === limit
  const nextCursor = hasNext && transactions.length > 0
    ? transactions[transactions.length - 1].createdAt.toISOString()
    : null

  return NextResponse.json({
    total,
    stats,
    transactions: transactions.map((t) => ({
      id: t.id,
      type: t.type,
      direction: t.direction,
      currency: t.currency,
      amount: Number(t.amount),
      balanceAfter: Number(t.balanceAfter),
      description: t.description,
      referenceId: t.referenceId,
      referenceType: t.referenceType,
      createdAt: t.createdAt,
    })),
    pagination: {
      limit,
      hasNext,
      nextCursor,
      count: transactions.length,
    },
  })
}
