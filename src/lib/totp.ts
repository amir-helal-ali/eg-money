import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

/**
 * TOTP (Time-based One-Time Password) implementation per RFC 6238.
 *
 * Uses Node's built-in `crypto` module — no external dependencies.
 * Compatible with Google Authenticator, Authy, Microsoft Authenticator, etc.
 *
 * Algorithm: HOTP(secret, floor(unix_time / 30))
 *   - 6-digit code
 *   - 30-second window
 *   - SHA-1 hash (standard for TOTP)
 *
 * SECURITY:
 *   - Secret is base32-encoded (required by authenticator apps)
 *   - Verification allows ±1 time window (30s skew) to tolerate clock drift
 *   - Constant-time comparison prevents timing attacks
 *   - Backup codes are hashed with SHA-256 (single-use, see verifyBackupCode)
 */

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const TOTP_WINDOW_SEC = 30
const TOTP_DIGITS = 6

// ===== Base32 encoding/decoding =====

export function base32Encode(buffer: Buffer): string {
  let result = ''
  let bits = 0
  let value = 0
  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      result += BASE32_CHARS[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) {
    result += BASE32_CHARS[(value << (5 - bits)) & 31]
  }
  return result
}

export function base32Decode(str: string): Buffer {
  const clean = str.replace(/=+$/, '').replace(/\s/g, '').toUpperCase()
  let bits = 0
  let value = 0
  const bytes: number[] = []
  for (const char of clean) {
    const idx = BASE32_CHARS.indexOf(char)
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(bytes)
}

// ===== TOTP core =====

/**
 * Generate a new random TOTP secret (20 bytes = 160 bits, base32-encoded).
 * This is the secret the user scans as a QR code in their authenticator app.
 */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20))
}

/**
 * Compute the TOTP code for a given secret + time.
 * @param secretBase32 base32-encoded secret
 * @param time Unix timestamp (seconds). Defaults to now.
 * @param windowSec Time step in seconds (default 30 per RFC 6238)
 */
export function computeTotp(
  secretBase32: string,
  time: number = Math.floor(Date.now() / 1000),
  windowSec: number = TOTP_WINDOW_SEC,
): string {
  const counter = Math.floor(time / windowSec)
  const counterBuffer = Buffer.alloc(8)
  // Write counter as big-endian 64-bit integer
  counterBuffer.writeBigUInt64BE(BigInt(counter), 0)

  const secretBuffer = base32Decode(secretBase32)
  const hmac = createHmac('sha1', secretBuffer).update(counterBuffer).digest()

  // Dynamic truncation (per RFC 4226)
  const offset = hmac[hmac.length - 1] & 0x0f
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  const code = binary % Math.pow(10, TOTP_DIGITS)
  return code.toString().padStart(TOTP_DIGITS, '0')
}

/**
 * Verify a TOTP code against a secret.
 * Allows ±1 time window (±30s) to tolerate clock drift between server and
 * authenticator app. Uses constant-time comparison.
 *
 * @returns true if the code is valid for current/previous/next window
 */
export function verifyTotp(
  code: string,
  secretBase32: string,
  time: number = Math.floor(Date.now() / 1000),
): boolean {
  if (!code || code.length !== TOTP_DIGITS) return false

  // Check current window + ±1 window for clock drift
  for (const offset of [-1, 0, 1]) {
    const expectedCode = computeTotp(secretBase32, time + offset * TOTP_WINDOW_SEC)
    if (timingSafeStringEqual(code, expectedCode)) {
      return true
    }
  }
  return false
}

// ===== Backup codes =====

/**
 * Generate 8 single-use backup codes (8 chars each, alphanumeric).
 * The user stores these in a safe place and can use them to log in if they
 * lose their authenticator device.
 *
 * @returns array of plaintext codes (caller must hash before storing)
 */
export function generateBackupCodes(): string[] {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const codes: string[] = []
  for (let i = 0; i < 8; i++) {
    let code = ''
    const bytes = randomBytes(8)
    for (let j = 0; j < 8; j++) {
      code += chars[bytes[j] % chars.length]
    }
    codes.push(code)
  }
  return codes
}

/**
 * Hash a backup code with SHA-256 for storage.
 * Never store plaintext backup codes — if the DB leaks, attackers could use them.
 */
export function hashBackupCode(code: string): string {
  return createHmac('sha256', process.env.BACKUP_CODE_PEPPER || 'default-pepper-change-me')
    .update(code.toUpperCase())
    .digest('hex')
}

/**
 * Verify a backup code against a list of hashed codes.
 * Uses constant-time comparison. Returns the index of the matched code (so
 * caller can remove it from the list — backup codes are single-use) or -1.
 */
export function verifyBackupCode(
  code: string,
  hashedCodes: string[],
): number {
  if (!code || hashedCodes.length === 0) return -1
  const hashed = hashBackupCode(code)
  for (let i = 0; i < hashedCodes.length; i++) {
    if (timingSafeStringEqual(hashed, hashedCodes[i])) {
      return i
    }
  }
  return -1
}

// ===== otpauth:// URL (for QR codes) =====

/**
 * Build an `otpauth://` URL for QR code generation.
 * Authenticator apps scan this URL to add the account.
 *
 * Format: otpauth://totp/LABEL?secret=SECRET&issuer=ISSUER&digits=6&period=30
 */
export function buildOtpAuthUrl(
  issuer: string,
  accountName: string,
  secretBase32: string,
): string {
  const label = encodeURIComponent(`${issuer}:${accountName}`)
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    digits: String(TOTP_DIGITS),
    period: String(TOTP_WINDOW_SEC),
  })
  return `otpauth://totp/${label}?${params.toString()}`
}

// ===== Helpers =====

function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  return timingSafeEqual(aBuf, bBuf)
}
