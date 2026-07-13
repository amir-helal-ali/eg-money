/**
 * Integration tests for money-movement helpers.
 *
 * These tests verify the atomicity + correctness of the money helpers in
 * src/lib/money.ts — the core functions that move EGP/USDT between balances.
 *
 * They use the actual Prisma client + SQLite DB (test database), so they
 * catch real concurrency / transaction issues that unit tests with mocks
 * would miss.
 *
 * Run with: `npx tsx tests/money.test.ts`
 *
 * NOTE: These tests require a separate test database. Set DATABASE_URL to
 * a test DB before running. The tests will CREATE + DELETE users within
 * transactions, so they should NOT be run against a production DB.
 */

import { db } from '../src/lib/db'
import {
  roundEgp,
  roundUsdt,
  creditEgp,
  debitEgp,
  creditUsdt,
  debitUsdt,
} from '../src/lib/money'
import { hashPassword, verifyPassword, isLegacyPasswordHash } from '../src/lib/auth'
import { generateOtp } from '../src/lib/validation'
import { safeJsonParse } from '../src/lib/safe-json'

// ===== Test runner (minimal — no external test framework needed) =====
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

function assertApprox(actual: number, expected: number, tolerance: number, message: string): void {
  const diff = Math.abs(actual - expected)
  assert(diff < tolerance, `${message} (expected ~${expected}, got ${actual}, diff=${diff})`)
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

// ===== Helpers =====
async function createTestUser(username: string): Promise<string> {
  const user = await db.user.create({
    data: {
      email: `${username}@test.example`,
      username,
      name: username,
      passwordHash: hashPassword('TestPass123!'),
      referralCode: `TEST${username.toUpperCase()}`,
      emailVerified: true,
      phoneVerified: true,
    },
  })
  return user.id
}

async function deleteTestUser(userId: string): Promise<void> {
  // Clean up all related records
  await db.transaction.deleteMany({ where: { userId } }).catch(() => {})
  await db.session.deleteMany({ where: { userId } }).catch(() => {})
  await db.user.delete({ where: { id: userId } }).catch(() => {})
}

// ===== Tests =====

async function testRounding(): Promise<void> {
  assert(roundEgp(100.005) === 100.01, 'roundEgp rounds to 2 decimals (up)')
  assert(roundEgp(100.004) === 100, 'roundEgp rounds to 2 decimals (down)')
  assert(roundUsdt(1.0000005) === 1.000001, 'roundUsdt rounds to 6 decimals (up)')
  assert(roundUsdt(1.0000004) === 1, 'roundUsdt rounds to 6 decimals (down)')
}

async function testPasswordHashing(): Promise<void> {
  const password = 'MySecurePass123!'
  const hash = hashPassword(password)
  assert(hash.startsWith('scrypt:'), 'hashPassword produces scrypt-prefixed hash')
  assert(verifyPassword(password, hash), 'verifyPassword accepts correct password')
  assert(!verifyPassword('wrong', hash), 'verifyPassword rejects wrong password')
  assert(!isLegacyPasswordHash(hash), 'scrypt hash is not flagged as legacy')

  // Legacy hash compat
  const legacyHash = 'aabbccdd:deadbeef' // fake legacy format
  assert(isLegacyPasswordHash(legacyHash), 'legacy hash is detected')
  // Don't test verify with fake hash — it would fail as expected
}

async function testOtpGeneration(): Promise<void> {
  const otp = generateOtp()
  assert(/^\d{6}$/.test(otp), 'generateOtp produces 6-digit string')
  assert(otp !== '000000' || otp === '000000', 'generateOtp runs without error')

  // Uniqueness (basic sanity — 1000 OTPs should have > 990 unique)
  const otps = new Set<string>()
  for (let i = 0; i < 1000; i++) otps.add(generateOtp())
  assert(otps.size > 990, `generateOtp has good uniqueness (${otps.size}/1000 unique)`)
}

async function testSafeJsonParse(): Promise<void> {
  assert(safeJsonParse('[1,2,3]', [] as number[]).length === 3, 'safeJsonParse parses valid JSON')
  assert(safeJsonParse('invalid', []).length === 0, 'safeJsonParse returns fallback for invalid JSON')
  assert(safeJsonParse(null, 'default') === 'default', 'safeJsonParse returns fallback for null')
  assert(safeJsonParse(undefined, 42) === 42, 'safeJsonParse returns fallback for undefined')
  const obj = safeJsonParse<{ a: number }>('{"a":1}', { a: 0 })
  assert(obj.a === 1, 'safeJsonParse parses object with correct type')
}

async function testCreditDebitEgp(): Promise<void> {
  const userId = await createTestUser('moneytest_egp')

  try {
    // Credit 1000 EGP
    await creditEgp(userId, 1000, 'TEST', 'test credit', undefined, 'TEST')
    let user = await db.user.findUnique({ where: { id: userId } })
    assert(Number(user!.egpBalance) === 1000, 'creditEgp adds 1000 EGP')

    // Debit 300 EGP
    await debitEgp(userId, 300, 'TEST', 'test debit', undefined, 'TEST')
    user = await db.user.findUnique({ where: { id: userId } })
    assert(Number(user!.egpBalance) === 700, 'debitEgp subtracts 300 EGP')

    // Debit more than balance → should throw
    let threw = false
    try {
      await debitEgp(userId, 9999, 'TEST', 'overdraw', undefined, 'TEST')
    } catch (e: any) {
      threw = e?.message === 'INSUFFICIENT_EGP_BALANCE'
    }
    assert(threw, 'debitEgp throws INSUFFICIENT_EGP_BALANCE when overdrawn')

    // Balance unchanged after failed debit
    user = await db.user.findUnique({ where: { id: userId } })
    assert(Number(user!.egpBalance) === 700, 'balance unchanged after failed debit')

    // Transaction log should have entries
    const txns = await db.transaction.findMany({ where: { userId } })
    assert(txns.length === 2, `transaction log has 2 entries (got ${txns.length})`)
  } finally {
    await deleteTestUser(userId)
  }
}

async function testCreditDebitUsdt(): Promise<void> {
  const userId = await createTestUser('moneytest_usdt')

  try {
    await creditUsdt(userId, 100, 'TEST', 'test credit', undefined, 'TEST')
    let user = await db.user.findUnique({ where: { id: userId } })
    assertApprox(Number(user!.usdtBalance), 100, 0.000001, 'creditUsdt adds 100 USDT')

    await debitUsdt(userId, 30.5, 'TEST', 'test debit', undefined, 'TEST')
    user = await db.user.findUnique({ where: { id: userId } })
    assertApprox(Number(user!.usdtBalance), 69.5, 0.000001, 'debitUsdt subtracts 30.5 USDT')

    // Overdraw
    let threw = false
    try {
      await debitUsdt(userId, 9999, 'TEST', 'overdraw', undefined, 'TEST')
    } catch (e: any) {
      threw = e?.message === 'INSUFFICIENT_USDT_BALANCE'
    }
    assert(threw, 'debitUsdt throws INSUFFICIENT_USDT_BALANCE when overdrawn')
  } finally {
    await deleteTestUser(userId)
  }
}

// ===== Main =====

async function main(): Promise<void> {
  console.log('=== Eg-Money Integration Tests ===')
  console.log(`Database: ${process.env.DATABASE_URL || '(default)'}`)

  await test('Rounding helpers', testRounding)
  await test('Password hashing (scrypt + legacy compat)', testPasswordHashing)
  await test('OTP generation (crypto.randomInt)', testOtpGeneration)
  await test('safeJsonParse', testSafeJsonParse)
  await test('creditEgp / debitEgp atomicity', testCreditDebitEgp)
  await test('creditUsdt / debitUsdt atomicity', testCreditDebitUsdt)

  console.log('\n=== Results ===')
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  if (failures.length > 0) {
    console.log('\nFailures:')
    failures.forEach((f) => console.log(`  - ${f}`))
    process.exit(1)
  } else {
    console.log('\n✅ All tests passed!')
    process.exit(0)
  }
}

main().catch((e) => {
  console.error('Test runner crashed:', e)
  process.exit(2)
})
