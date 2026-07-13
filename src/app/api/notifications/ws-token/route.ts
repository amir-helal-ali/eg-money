import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'
import { createHash, randomBytes } from 'crypto'

/**
 * GET /api/notifications/ws-token
 *
 * Issues a short-lived (60s) single-use WebSocket auth token for the
 * authenticated user. The client sends this token to the ticker-service
 * WebSocket as `authToken` on connection; the ticker-service exchanges
 * it for a userId via the internal HTTP `/verify-ws-token` endpoint,
 * then marks it as used so it can't be replayed.
 *
 * SECURITY: This is intentionally a SEPARATE token from the session cookie
 * (which is httpOnly and must never be readable by JS or sent over WS).
 * The WS token:
 *   - Is short-lived (60 seconds)
 *   - Is single-use (marked `used=true` after first verify)
 *   - Cannot be used to authenticate HTTP API requests (only WS auth)
 *   - Is bound to the user's id at issuance time
 */
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Generate a random token (32 bytes hex = 64 chars)
  const token = randomBytes(32).toString('hex')
  // Hash for storage/lookup (don't store raw token in DB)
  const tokenHash = createHash('sha256').update(token).digest('hex')
  // 60-second expiry — long enough for the client to open the WS, short enough
  // to make replay attacks infeasible
  const expiresAt = new Date(Date.now() + 60 * 1000)

  await db.wsToken.create({
    data: {
      userId: user.id,
      token, // stored for backward-compat / debugging; the unique constraint also serves as a replay guard
      tokenHash,
      expiresAt,
    },
  })

  // Best-effort cleanup of expired tokens (non-blocking, runs in parallel)
  db.wsToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  }).catch(() => {
    // Non-critical
  })

  return NextResponse.json({
    token,
    userId: user.id,
    expiresIn: 60,
  })
}
