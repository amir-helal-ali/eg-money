/**
 * Run with:  npx tsx scripts/reset-admin.ts
 *
 * Ensures the admin user has a verified phone number and a known password.
 * Useful for development / new deployments where the admin account was
 * created without a phone.
 *
 * Defaults applied:
 *   phone:         +201000000000
 *   countryCode:   +20
 *   phoneVerified: true
 *   emailVerified: true
 *   password:      admin123   (override via ADMIN_RESET_PASSWORD env var)
 *
 * The script is idempotent — running it multiple times is safe.
 */

import { hashPassword } from '../src/lib/auth'
import { db } from '../src/lib/db'

async function main() {
  const newPassword = process.env.ADMIN_RESET_PASSWORD || 'admin123'
  const newPasswordHash = hashPassword(newPassword)

  // Find any admin
  const existing = await db.user.findFirst({ where: { role: 'ADMIN' } })
  if (!existing) {
    console.error('No admin user found. Run /api/seed first to create one.')
    process.exit(1)
  }

  const updated = await db.user.update({
    where: { id: existing.id },
    data: {
      passwordHash: newPasswordHash,
      phone: '+201000000000',
      countryCode: '+20',
      phoneVerified: true,
      emailVerified: true,
    },
  })

  console.log('Admin account reset:')
  console.log('  email:        ', updated.email)
  console.log('  username:     ', updated.username)
  console.log('  phone:        ', updated.phone)
  console.log('  countryCode:  ', updated.countryCode)
  console.log('  phoneVerified:', updated.phoneVerified)
  console.log('  emailVerified:', updated.emailVerified)
  console.log('  password:     ', newPassword, '(change it immediately after login)')
  console.log()
  console.log('Done.')
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
