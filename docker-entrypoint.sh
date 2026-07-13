#!/bin/sh
# ===== Eg-Money Docker Entrypoint =====
# Runs both the Next.js app and the ticker-service in the same container.
# Uses a process manager pattern with trap for clean shutdown.

set -e

echo "=== Eg-Money Container Starting ==="
echo "Node version: $(node --version)"
echo "Working directory: $(pwd)"
echo ""

# ===== 0. Validate required env vars =====
# Refuse to start in production if critical secrets are missing.
if [ "$NODE_ENV" = "production" ]; then
  echo "[0/3] Validating environment..."
  missing=""
  [ -z "$INTERNAL_SECRET" ] && missing="$missing INTERNAL_SECRET"
  [ -z "$CRON_SECRET" ] && missing="$missing CRON_SECRET"
  if [ -n "$missing" ]; then
    echo "ERROR: Missing required env vars:$missing"
    echo "Set them in your .env file (each must be ≥32 chars of random data)."
    exit 1
  fi
  if [ ${#INTERNAL_SECRET} -lt 32 ] || [ ${#CRON_SECRET} -lt 32 ]; then
    echo "ERROR: INTERNAL_SECRET and CRON_SECRET must each be ≥32 chars in production."
    exit 1
  fi
  echo "  All required secrets present."
  echo ""
fi

# ===== 1. Run database migrations =====
# Use `prisma db push` (without --accept-data-loss) for dev / first-run.
# In production with PostgreSQL, prefer `prisma migrate deploy` to run only
# pending migrations and never destructively alter data.
echo "[1/3] Pushing database schema..."
if [ "$NODE_ENV" = "production" ]; then
  # Production: use migrations if any exist, otherwise db push (safe — additive only)
  if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
    npx prisma migrate deploy 2>/dev/null || echo "  (migrate deploy failed — falling back to db push)"
  else
    npx prisma db push 2>/dev/null || echo "  (db push skipped — using existing schema)"
  fi
else
  # Dev: db push is fine (schema is additive; we never --accept-data-loss here)
  npx prisma db push 2>/dev/null || echo "  (db push skipped — using existing schema)"
fi
npx prisma generate 2>/dev/null || true
echo ""

# ===== 2. Start the ticker-service in background =====
echo "[2/3] Starting ticker-service (ports 3003 WebSocket, 3004 HTTP)..."
npx tsx mini-services/ticker-service/index.ts &
TICKER_PID=$!
echo "  Ticker PID: $TICKER_PID"
echo ""

# ===== 3. Start the Next.js app (foreground) =====
echo "[3/3] Starting Next.js app (port 3000)..."
echo ""

# Cleanup on exit
cleanup() {
  echo ""
  echo "Shutting down..."
  kill $TICKER_PID 2>/dev/null || true
  wait $TICKER_PID 2>/dev/null || true
  echo "Done."
}
trap cleanup SIGTERM SIGINT EXIT

# Start Next.js (this blocks)
exec node server.js
