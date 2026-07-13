import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/session'

/**
 * GET /api/auth/sessions
 * Lists the current user's active sessions (so they can see which devices
 * are logged in and revoke any they don't recognize).
 *
 * The current session (the one making this request) is flagged with
 * `isCurrent: true` so the UI can prevent users from revoking their own
 * active session by accident (or show a warning if they try).
 *
 * SECURITY: Session tokens are stored as SHA-256 hashes — we never return
 * the raw token. Only metadata (createdAt, lastUsedAt, IP, UA, expiresAt)
 * is exposed, plus an `id` that can be used to revoke via DELETE.
 */
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get the current session token (to flag it)
  const authHeader = req.headers.get('authorization')
  let currentToken: string | null = null
  if (authHeader && authHeader.startsWith('Bearer ')) {
    currentToken = authHeader.substring(7)
  } else {
    currentToken = req.cookies.get('session_token')?.value ?? null
  }

  // Hash it to compare with stored hashes
  let currentTokenHash: string | null = null
  if (currentToken) {
    const { createHash } = await import('crypto')
    currentTokenHash = createHash('sha256').update(currentToken).digest('hex')
  }

  const sessions = await db.session.findMany({
    where: {
      userId: user.id,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastUsedAt: 'desc' },
    select: {
      id: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      lastUsedAt: true,
      expiresAt: true,
      tokenHash: true,
    },
  })

  return NextResponse.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt,
      expiresAt: s.expiresAt,
      isCurrent: s.tokenHash === currentTokenHash,
    })),
  })
}

/**
 * DELETE /api/auth/sessions?id=<sessionId>
 * Revokes a specific session (logs out that device).
 *
 * SECURITY: The session must belong to the current user. The current session
 * cannot be revoked via this endpoint (use /api/auth/logout instead) — this
 * prevents users from accidentally locking themselves out.
 *
 * If `?id=all` is passed, all OTHER sessions (not the current one) are revoked.
 */
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const sessionId = url.searchParams.get('id')

  if (!sessionId) {
    return NextResponse.json({ error: 'معرف الجلسة مطلوب' }, { status: 400 })
  }

  // Get current token hash to protect the current session
  const authHeader = req.headers.get('authorization')
  let currentToken: string | null = null
  if (authHeader && authHeader.startsWith('Bearer ')) {
    currentToken = authHeader.substring(7)
  } else {
    currentToken = req.cookies.get('session_token')?.value ?? null
  }
  let currentTokenHash: string | null = null
  if (currentToken) {
    const { createHash } = await import('crypto')
    currentTokenHash = createHash('sha256').update(currentToken).digest('hex')
  }

  if (sessionId === 'all') {
    // Revoke all sessions EXCEPT the current one
    const result = await db.session.deleteMany({
      where: {
        userId: user.id,
        NOT: currentTokenHash ? { tokenHash: currentTokenHash } : {},
      },
    })
    return NextResponse.json({
      success: true,
      revoked: result.count,
      message: `تم إنهاء ${result.count} جلسة أخرى`,
    })
  }

  // Revoke a specific session — must belong to the user
  const targetSession = await db.session.findUnique({
    where: { id: sessionId },
    select: { userId: true, tokenHash: true },
  })

  if (!targetSession) {
    return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 })
  }
  if (targetSession.userId !== user.id) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  if (targetSession.tokenHash === currentTokenHash) {
    return NextResponse.json(
      { error: 'لا يمكن إنهاء الجلسة الحالية من هنا. استخدم تسجيل الخروج.' },
      { status: 400 },
    )
  }

  await db.session.delete({ where: { id: sessionId } })

  return NextResponse.json({
    success: true,
    message: 'تم إنهاء الجلسة',
  })
}
