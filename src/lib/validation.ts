// Shared validation helpers used by auth API routes
// Keeps server-side rules in one place so they stay consistent.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Username: 3-20 chars, letters, digits, underscore, dot, hyphen
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,20}$/

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim().toLowerCase())
}

export function isValidUsername(username: string): boolean {
  return USERNAME_RE.test(username.trim())
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase()
}

// Phone validation: international format +[country][number], 7-15 digits total
export function normalizePhone(countryCode: string, phone: string): string {
  const cc = countryCode.replace(/\s+/g, '')
  const local = phone.replace(/[\s\-()]/g, '').replace(/^0+/, '')
  return `${cc}${local}`
}

export function isValidInternationalPhone(fullPhone: string): boolean {
  // +CC followed by 7-14 digits
  return /^\+\d{7,15}$/.test(fullPhone)
}

// ===== Strong password rules =====
// Minimum 8 chars, must include: upper, lower, digit, special char
export function isStrongPassword(password: string): boolean {
  if (password.length < 8) return false
  if (!/[a-z]/.test(password)) return false
  if (!/[A-Z]/.test(password)) return false
  if (!/[0-9]/.test(password)) return false
  if (!/[^A-Za-z0-9]/.test(password)) return false
  return true
}

export function passwordStrength(password: string): {
  score: 0 | 1 | 2 | 3 | 4
  label: 'weak' | 'fair' | 'good' | 'strong' | 'veryStrong'
  checks: { length: boolean; lower: boolean; upper: boolean; number: boolean; symbol: boolean }
} {
  const checks = {
    length: password.length >= 8,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  }
  const score = (Object.values(checks) as boolean[]).filter(Boolean).length
  const mapped = Math.max(0, Math.min(4, score - 1)) as 0 | 1 | 2 | 3 | 4
  const labels = ['weak', 'fair', 'good', 'strong', 'veryStrong'] as const
  return { score: mapped, label: labels[mapped], checks }
}

export function generateReferralCode(name?: string | null): string {
  const prefix = (name || 'EG')
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'EG')
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `${prefix}${rand}`
}

export function generateOtp(): string {
  // 6-digit code — uses crypto.randomInt for cryptographic security
  // (Math.random() is NOT suitable for security-sensitive tokens)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { randomInt } = require('crypto') as typeof import('crypto')
  return randomInt(100000, 1000000).toString()
}

// Mask helpers for UI display
export function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  if (!domain || user.length <= 2) return email
  const visible = user.slice(0, 2)
  return `${visible}${'*'.repeat(Math.min(user.length - 2, 6))}@${domain}`
}

export function maskPhone(phone: string): string {
  // Show last 2 digits visible, mask middle
  if (phone.length <= 4) return phone
  const last2 = phone.slice(-2)
  const prefix = phone.slice(0, Math.min(4, phone.length - 2))
  return `${prefix}${'*'.repeat(Math.min(phone.length - 4, 8))}${last2}`
}
