import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export type AuthUser = {
  id: string
  email: string
  username: string
  name: string | null
  phone: string | null
  countryCode: string | null
  role: string
  egpBalance: number
  usdtBalance: number
  status: string
  referralCode: string
  googleId: string | null
  googleAvatar: string | null
  emailVerified: boolean
  phoneVerified: boolean
  totpEnabled: boolean
}

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.get('authorization')
  let token: string | null = null

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  } else {
    token = req.cookies.get('session_token')?.value ?? null
  }

  if (!token) return null

  // getSession is now async (DB-backed session store)
  const session = await getSession(token)
  if (!session) return null

  const user = await db.user.findUnique({
    where: { id: session.userId },
  })
  if (!user) return null
  if (user.status !== 'ACTIVE') return null

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    phone: user.phone,
    countryCode: user.countryCode,
    role: user.role,
    egpBalance: Number(user.egpBalance),
    usdtBalance: Number(user.usdtBalance),
    status: user.status,
    referralCode: user.referralCode,
    googleId: user.googleId,
    googleAvatar: user.googleAvatar,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    totpEnabled: user.totpEnabled,
  }
}

export async function requireAdmin(req: NextRequest): Promise<AuthUser | null> {
  const user = await getAuthUser(req)
  if (!user) return null
  if (user.role !== 'ADMIN') return null
  return user
}
