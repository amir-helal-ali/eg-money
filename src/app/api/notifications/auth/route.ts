import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'
import { createHash } from 'crypto'

/**
 * Used by the ticker-service to verify a WebSocket auth token.
 *
 * Two modes:
 *  1. GET with session_token cookie — backward-compat for existing clients.
 *     SECURITY: This path passes the httpOnly session token through to the
 *     WS server, which is less safe than mode 2.
 *  2. POST with { wsToken } body — the new short-lived single-use WS token
 *     issued by /api/notifications/ws-token. Preferred path. After successful
 *     verification, the WS token is marked as used (single-use).
 *
 * Returns { userId } on success, 401 on failure.
 */
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ userId: user.id })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { wsToken } = body as { wsToken?: string }
    if (!wsToken || typeof wsToken !== 'string') {
      return NextResponse.json({ error: 'wsToken required' }, { status: 400 })
    }

    // Hash the supplied token for lookup
    const tokenHash = createHash('sha256').update(wsToken).digest('hex')

    // Atomic single-use: only succeed if the token is unused and unexpired
    // Use a conditional updateMany to ensure single-use semantics across
    // concurrent verify attempts.
    const now = new Date()
    const result = await db.wsToken.updateMany({
      where: {
        tokenHash,
        used: false,
        expiresAt: { gt: now },
      },
      data: { used: true },
    })

    if (result.count === 0) {
      // Either doesn't exist, already used, or expired
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Fetch the userId now that we've marked it as used
    const wsTokenRow = await db.wsToken.findUnique({
      where: { tokenHash },
      select: { userId: true },
    })

    if (!wsTokenRow) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    return NextResponse.json({ userId: wsTokenRow.userId })
  } catch (e) {
    console.error('WS token verify error:', e)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
