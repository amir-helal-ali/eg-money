import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'

// ===== Password hashing =====
// SECURITY: Use scrypt (Node's built-in KDF) instead of the previous
// hand-rolled multi-round SHA-512. scrypt is memory-hard, well-audited,
// and the recommended choice when argon2 isn't available.
//
// We auto-detect legacy hashes (format: `salt:hex` from the old scheme)
// and verify them with the old code path. On next successful login, the
// hash is transparently upgraded to scrypt format (`scrypt:N:r:p:salt:hash`).
const SCRYPT_N = 16384 // CPU/memory cost
const SCRYPT_R = 8     // block size
const SCRYPT_P = 1     // parallelization
const SCRYPT_KEYLEN = 64

export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  })
  return `scrypt:${SCRYPT_N}:${SCRYPT_R}:${SCRYPT_P}:${salt.toString('hex')}:${hash.toString('hex')}`
}

export function verifyPassword(password: string, stored: string): boolean {
  // New format: scrypt:N:r:p:salt:hash
  if (stored.startsWith('scrypt:')) {
    const parts = stored.split(':')
    if (parts.length !== 6) return false
    const N = parseInt(parts[1], 10)
    const r = parseInt(parts[2], 10)
    const p = parseInt(parts[3], 10)
    const salt = Buffer.from(parts[4], 'hex')
    const expectedHash = Buffer.from(parts[5], 'hex')
    const actualHash = scryptSync(password, salt, SCRYPT_KEYLEN, { N, r, p })
    return actualHash.length === expectedHash.length && timingSafeEqual(actualHash, expectedHash)
  }

  // Legacy format: salt:hex (old multi-round SHA-512)
  // Keep this path so existing users can still log in. Their hash will be
  // upgraded to scrypt on the next successful login (handled in /login route).
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const ITERATIONS = 10000
  let final = createHash('sha512').update(salt + password).digest('hex')
  for (let i = 0; i < ITERATIONS; i++) {
    final = createHash('sha512').update(salt + final).digest('hex')
  }
  return final === hash
}

/** Returns true if the stored hash uses the legacy (non-scrypt) format. */
export function isLegacyPasswordHash(stored: string): boolean {
  return !stored.startsWith('scrypt:')
}

// ===== Session token generation =====
export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

// ===== Session store (DB-backed) =====
// Sessions are stored in the `Session` table as a SHA-256 hash of the token.
// This survives server restarts and works across multiple instances.
//
// Each session records the client's IP + User-Agent for audit/binding.
// Sessions expire after SESSION_TTL_MS (7 days). lastUsedAt is updated on
// every successful getSession() call (sliding expiry would require a write
// per request — we skip that to reduce DB load; explicit sliding could be
// added later).
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

type SessionInfo = {
  userId: string
  token: string
  expiresAt: number
}

export async function createSession(
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<string> {
  const token = generateToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  await db.session.create({
    data: {
      userId,
      tokenHash,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      expiresAt,
    },
  })

  // Best-effort cleanup of expired sessions (non-blocking)
  db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {})

  return token
}

export async function getSession(token: string): Promise<SessionInfo | null> {
  if (!token) return null
  const tokenHash = hashToken(token)
  try {
    const session = await db.session.findUnique({
      where: { tokenHash },
      select: { userId: true, expiresAt: true },
    })
    if (!session) return null
    if (session.expiresAt.getTime() < Date.now()) {
      // Expired — delete and reject
      await db.session.delete({ where: { tokenHash } }).catch(() => {})
      return null
    }
    // Update lastUsedAt (best-effort, non-blocking) for sliding activity tracking
    db.session.update({
      where: { tokenHash },
      data: { lastUsedAt: new Date() },
    }).catch(() => {})
    return {
      userId: session.userId,
      token,
      expiresAt: session.expiresAt.getTime(),
    }
  } catch (e) {
    // DB might be unavailable — fail safe (no session)
    console.error('[auth] getSession failed:', e)
    return null
  }
}

export async function destroySession(token: string): Promise<void> {
  if (!token) return
  const tokenHash = hashToken(token)
  try {
    await db.session.delete({ where: { tokenHash } }).catch(() => {})
  } catch {
    // Best-effort
  }
}

export async function clearAllSessionsForUser(userId: string): Promise<void> {
  try {
    await db.session.deleteMany({ where: { userId } })
  } catch {
    // Best-effort
  }
}

// Alias for clarity at call sites
export const destroyAllUserSessions = clearAllSessionsForUser
