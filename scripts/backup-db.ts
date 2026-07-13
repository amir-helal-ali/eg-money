#!/usr/bin/env tsx
/**
 * Database backup script.
 *
 * Creates a timestamped backup of the SQLite database using `sqlite3` CLI's
 * `.backup` command (safe online backup — doesn't lock the DB).
 *
 * For PostgreSQL, replace with `pg_dump`.
 *
 * Usage:
 *   npx tsx scripts/backup-db.ts [--output-dir=/backups] [--retain=30]
 *
 * Cron (daily at 2 AM):
 *   0 2 * * * cd /app && npx tsx scripts/backup-db.ts --retain=30
 *
 * The --retain flag keeps the last N backups (deletes older ones).
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs'
import { join, resolve } from 'path'

// ===== Parse args =====
const args = process.argv.slice(2)
function getArg(name: string, defaultValue: string): string {
  const found = args.find((a) => a.startsWith(`--${name}=`))
  return found ? found.split('=')[1] : defaultValue
}

const outputDir = resolve(getArg('output-dir', './backups'))
const retainCount = parseInt(getArg('retain', '30'), 10)

// ===== Resolve DB path =====
// DATABASE_URL format: file:/path/to/db.sqlite
const dbUrl = process.env.DATABASE_URL || ''
let dbPath = dbUrl.replace(/^file:/, '')
if (!dbPath) {
  console.error('ERROR: DATABASE_URL not set or not a file: URL')
  process.exit(1)
}
// Resolve relative to cwd
if (!dbPath.startsWith('/')) {
  dbPath = join(process.cwd(), dbPath)
}

if (!existsSync(dbPath)) {
  console.error(`ERROR: Database file not found: ${dbPath}`)
  process.exit(1)
}

// ===== Create output directory =====
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true })
}

// ===== Generate backup =====
const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const backupPath = join(outputDir, `eg-money-${timestamp}.db`)

console.log(`[backup] Starting backup...`)
console.log(`  Source: ${dbPath}`)
console.log(`  Target: ${backupPath}`)

try {
  // Use sqlite3 CLI's .backup command — it's an online backup that doesn't
  // lock the database. Falls back to file copy if sqlite3 isn't installed.
  try {
    execSync(`sqlite3 "${dbPath}" ".backup '${backupPath}'"`, {
      stdio: 'pipe',
      timeout: 60_000,
    })
    console.log(`  ✅ Backup created via sqlite3 .backup`)
  } catch (e) {
    // Fallback: copy the file directly (may be slightly inconsistent if writes
    // happen during copy, but SQLite WAL mode makes this rare)
    console.log(`  ⚠️  sqlite3 CLI not available, falling back to file copy`)
    execSync(`cp "${dbPath}" "${backupPath}"`, { stdio: 'pipe' })
    console.log(`  ✅ Backup created via file copy`)
  }

  // Also copy the -wal and -shm files if they exist (WAL mode)
  for (const ext of ['-wal', '-shm']) {
    const sidecar = dbPath + ext
    if (existsSync(sidecar)) {
      execSync(`cp "${sidecar}" "${backupPath}${ext}"`, { stdio: 'pipe' })
    }
  }

  // Verify backup
  const size = statSync(backupPath).size
  console.log(`  Size: ${(size / 1024).toFixed(1)} KB`)
} catch (e) {
  console.error(`  ❌ Backup failed:`, e)
  process.exit(1)
}

// ===== Retention: delete old backups =====
if (retainCount > 0) {
  console.log(`[backup] Applying retention (keep last ${retainCount})...`)
  const backups = readdirSync(outputDir)
    .filter((f) => f.startsWith('eg-money-') && f.endsWith('.db'))
    .map((f) => ({
      name: f,
      path: join(outputDir, f),
      mtime: statSync(join(outputDir, f)).mtime,
    }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())

  const toDelete = backups.slice(retainCount)
  for (const old of toDelete) {
    console.log(`  Deleting: ${old.name}`)
    unlinkSync(old.path)
    // Also delete sidecars
    for (const ext of ['-wal', '-shm']) {
      const sidecar = old.path + ext
      if (existsSync(sidecar)) unlinkSync(sidecar)
    }
  }
  console.log(`  Kept ${backups.length - toDelete.length} of ${backups.length} backups`)
}

console.log(`[backup] Done.`)
