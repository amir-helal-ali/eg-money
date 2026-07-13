/**
 * Integration tests for TOTP 2FA + OTP + session management.
 *
 * Tests the TOTP implementation (RFC 6238), backup codes, and the
 * session/OTP helpers that were added in P3.
 *
 * Run with: `npx tsx tests/security.test.ts`
 */

import { db } from '../src/lib/db'
import {
  generateTotpSecret,
  computeTotp,
  verifyTotp,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
  buildOtpAuthUrl,
  base32Encode,
  base32Decode,
} from '../src/lib/totp'
import { generateOtp } from '../src/lib/validation'
import { hashPassword, verifyPassword, generateToken, createSession, getSession, destroySession } from '../src/lib/auth'
import { safeJsonParse } from '../src/lib/safe-json'

let passed = 0
let failed = 0
const failures: string[] = []

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++
  } else {
    failed++
    failures.push(message)
    console.error(`  ❌ ${message}`)
  }
}

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  console.log(`\n→ ${name}`)
  try {
    await fn()
  } catch (e) {
    failed++
    failures.push(`${name}: threw ${e}`)
    console.error(`  ❌ threw:`, e)
  }
}

// ===== TOTP tests =====

async function testTotpSecretGeneration(): Promise<void> {
  const secret = generateTotpSecret()
  assert(secret.length >= 32, `generateTotpSecret produces 32+ char base32 string (got ${secret.length})`)
  // All chars must be valid base32
  assert(/^[A-Z2-7]+$/.test(secret), 'generateTotpSecret produces valid base32 chars')

  // Two secrets should differ
  const secret2 = generateTotpSecret()
  assert(secret !== secret2, 'generateTotpSecret produces unique secrets')
}

async function testBase32RoundTrip(): Promise<void> {
  const original = Buffer.from('Hello Eg-Money TOTP!', 'utf8')
  const encoded = base32Encode(original)
  const decoded = base32Decode(encoded)
  assert(
    decoded.toString('utf8') === original.toString('utf8'),
    'base32 encode/decode round-trips correctly',
  )
}

async function testTotpComputation(): Promise<void> {
  const secret = generateTotpSecret()

  // Same time → same code
  const now = Math.floor(Date.now() / 1000)
  const code1 = computeTotp(secret, now)
  const code2 = computeTotp(secret, now)
  assert(code1 === code2, 'same time → same TOTP code')
  assert(/^\d{6}$/.test(code1), 'TOTP code is 6 digits')

  // Different time window → different code (usually)
  const codeLater = computeTotp(secret, now + 60) // 2 windows later
  assert(code1 !== codeLater, 'different time window → different code (usually)')
}

async function testTotpVerification(): Promise<void> {
  const secret = generateTotpSecret()
  const now = Math.floor(Date.now() / 1000)
  const code = computeTotp(secret, now)

  // Valid code
  assert(verifyTotp(code, secret, now), 'verifyTotp accepts valid code')

  // ±1 window tolerance (clock drift)
  assert(verifyTotp(code, secret, now - 30), 'verifyTotp accepts code from previous window')
  assert(verifyTotp(code, secret, now + 30), 'verifyTotp accepts code from next window')

  // ±2 windows should fail
  assert(!verifyTotp(code, secret, now - 60), 'verifyTotp rejects code 2 windows ago')
  assert(!verifyTotp(code, secret, now + 60), 'verifyTotp rejects code 2 windows ahead')

  // Wrong code
  assert(!verifyTotp('000000', secret, now) || code === '000000', 'verifyTotp rejects wrong code')
  assert(!verifyTotp('12345', secret, now), 'verifyTotp rejects too-short code')
  assert(!verifyTotp('abc123', secret, now), 'verifyTotp rejects non-numeric code')
}

async function testBackupCodes(): Promise<void> {
  const codes = generateBackupCodes()
  assert(codes.length === 8, `generateBackupCodes produces 8 codes (got ${codes.length})`)
  assert(codes.every((c) => c.length === 8), 'each backup code is 8 chars')
  assert(new Set(codes).size === 8, 'all 8 backup codes are unique')

  // Hashing
  const hashed = codes.map(hashBackupCode)
  assert(hashed.every((h) => h.length === 64), 'hashed backup codes are 64 hex chars (SHA-256)')
  assert(hashed.every((h) => !codes.includes(h)), 'hashed codes differ from plaintext')

  // Verification
  const matchIdx = verifyBackupCode(codes[0], hashed)
  assert(matchIdx === 0, 'verifyBackupCode finds correct index')

  const wrongIdx = verifyBackupCode('WRONGCODE', hashed)
  assert(wrongIdx === -1, 'verifyBackupCode returns -1 for wrong code')

  // Empty list
  assert(verifyBackupCode(codes[0], []) === -1, 'verifyBackupCode returns -1 for empty list')
}

async function testOtpAuthUrl(): Promise<void> {
  const secret = generateTotpSecret()
  const url = buildOtpAuthUrl('Eg-Money', 'user@example.com', secret)
  assert(url.startsWith('otpauth://totp/'), 'otpauth URL has correct scheme')
  assert(url.includes('secret=' + secret), 'otpauth URL contains secret')
  assert(url.includes('issuer=Eg-Money'), 'otpauth URL contains issuer')
  assert(url.includes('digits=6'), 'otpauth URL specifies 6 digits')
  assert(url.includes('period=30'), 'otpauth URL specifies 30s period')
}

// ===== OTP generation test =====

async function testOtpGeneration(): Promise<void> {
  const otp = generateOtp()
  assert(/^\d{6}$/.test(otp), 'generateOtp produces 6-digit string')

  // Statistical test: 2000 OTPs should have > 1980 unique (allowing for rare collisions)
  const otps = new Set<string>()
  for (let i = 0; i < 2000; i++) otps.add(generateOtp())
  assert(otps.size > 1980, `generateOtp has good uniqueness (${otps.size}/2000 unique)`)
}

// ===== Session management tests =====

async function testSessionLifecycle(): Promise<void> {
  const userId = await (async () => {
    const user = await db.user.create({
      data: {
        email: 'session-test@test.example',
        username: 'sessiontest',
        name: 'Session Test',
        passwordHash: hashPassword('TestPass123!'),
        referralCode: 'TESTSESSION',
        emailVerified: true,
        phoneVerified: true,
      },
    })
    return user.id
  })()

  try {
    // Create session
    const token = await createSession(userId, '127.0.0.1', 'test-agent')
    assert(!!token, 'createSession returns a token')
    assert(token.length >= 64, 'session token is 64+ chars')

    // Get session
    const session = await getSession(token)
    assert(!!session, 'getSession returns the session')
    assert(session!.userId === userId, 'session has correct userId')

    // Wrong token
    const wrongSession = await getSession('invalid-token')
    assert(!wrongSession, 'getSession rejects invalid token')

    // Destroy session
    await destroySession(token)
    const destroyedSession = await getSession(token)
    assert(!destroyedSession, 'getSession returns null after destroySession')
  } finally {
    await db.session.deleteMany({ where: { userId } }).catch(() => {})
    await db.transaction.deleteMany({ where: { userId } }).catch(() => {})
    await db.user.delete({ where: { id: userId } }).catch(() => {})
  }
}

// ===== Password hashing with scrypt =====

async function testScryptPasswordHashing(): Promise<void> {
  const password = 'MySecurePass123!'
  const hash = hashPassword(password)

  assert(hash.startsWith('scrypt:'), 'hashPassword produces scrypt-prefixed hash')
  assert(hash.split(':').length === 6, 'scrypt hash has 6 colon-separated parts')

  // Verify correct
  assert(verifyPassword(password, hash), 'verifyPassword accepts correct password')

  // Verify wrong
  assert(!verifyPassword('WrongPass123!', hash), 'verifyPassword rejects wrong password')

  // Verify empty
  assert(!verifyPassword('', hash), 'verifyPassword rejects empty password')

  // Different passwords produce different hashes
  const hash2 = hashPassword('DifferentPass456!')
  assert(hash !== hash2, 'different passwords produce different hashes')
}

// ===== safeJsonParse =====

async function testSafeJsonParse(): Promise<void> {
  assert(safeJsonParse('[1,2,3]', [] as number[]).length === 3, 'parses valid JSON array')
  assert(safeJsonParse('{"a":1}', {}).a === 1, 'parses valid JSON object')
  assert(safeJsonParse('invalid', []).length === 0, 'returns fallback for invalid JSON')
  assert(safeJsonParse(null, 'default') === 'default', 'returns fallback for null')
  assert(safeJsonParse(undefined, 42) === 42, 'returns fallback for undefined')
  assert(safeJsonParse('', 'default') === 'default', 'returns fallback for empty string')
}

// ===== Main =====

async function main(): Promise<void> {
  console.log('=== Eg-Money Security Tests (TOTP + OTP + Sessions) ===')

  await test('TOTP secret generation', testTotpSecretGeneration)
  await test('Base32 round-trip', testBase32RoundTrip)
  await test('TOTP code computation', testTotpComputation)
  await test('TOTP verification (±1 window)', testTotpVerification)
  await test('Backup codes generation + verification', testBackupCodes)
  await test('otpauth:// URL generation', testOtpAuthUrl)
  await test('OTP generation (crypto.randomInt)', testOtpGeneration)
  await test('Session lifecycle (create/get/destroy)', testSessionLifecycle)
  await test('scrypt password hashing', testScryptPasswordHashing)
  await test('safeJsonParse', testSafeJsonParse)

  console.log('\n=== Results ===')
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  if (failures.length > 0) {
    console.log('\nFailures:')
    failures.forEach((f) => console.log(`  - ${f}`))
    process.exit(1)
  } else {
    console.log('\n✅ All security tests passed!')
    process.exit(0)
  }
}

main().catch((e) => {
  console.error('Test runner crashed:', e)
  process.exit(2)
})
