# Eg-Money — Architecture & Deployment Guide

## Overview

Eg-Money is an Egyptian P2P USDT/EGP trading platform built with Next.js 16,
Prisma (SQLite for dev, PostgreSQL for prod), and a separate Node.js
ticker-service for real-time price feeds + WebSocket push notifications.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Next.js    │  │  WebSocket  │  │  Service Worker (PWA)   │  │
│  │  React UI   │  │  (port 3003)│  │  Push notifications     │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────────┘  │
└─────────┼─────────────────┼─────────────────────────────────────┘
          │ HTTPS            │ WSS
          ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Caddy (port 80/443)                           │
│  Reverse proxy + TLS termination + Security headers              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              Docker Container (single image)                     │
│  ┌─────────────────┐  ┌──────────────────────────────────────┐  │
│  │  Next.js app    │  │  Ticker-service (background process) │  │
│  │  (port 3000)    │◄─┤  • Binance P2P price fetcher         │  │
│  │  • API routes   │  │  • WebSocket server (port 3003)      │  │
│  │  • React pages  │  │  • HTTP push API (port 3004)         │  │
│  │  • Auth/sessions│  │  • Price alert checker (cron)        │  │
│  │  • Prisma ORM   │  │  • P2P cleanup cron                  │  │
│  └────────┬────────┘  └──────────────────────────────────────┘  │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐  ┌──────────────────────────────────────┐  │
│  │  SQLite DB      │  │  /uploads/ (receipts, outside public)│  │
│  │  /app/db/       │  │  /app/uploads/                       │  │
│  └─────────────────┘  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Next.js App (port 3000)
- **API routes** under `src/app/api/` — RESTful endpoints for auth, trades,
  deposits, withdrawals, P2P, admin, notifications
- **React pages** under `src/app/` — server-rendered landing page + client
  components for dashboard, wallet, P2P, admin
- **Auth** — custom session system (DB-backed `Session` table, httpOnly cookies,
  optional TOTP 2FA)
- **Money helpers** (`src/lib/money.ts`) — atomic `creditEgp`/`debitEgp`/
  `creditUsdt`/`debitUsdt` with transaction-safe balance checks

### 2. Ticker-Service (port 3003 WS + 3004 HTTP)
- Runs in the same Docker container as a background process
- Fetches live USDT/EGP prices from Binance P2P API every 10s
- Serves prices over WebSocket (port 3003) to all connected clients
- Receives push notifications from Next.js via HTTP (port 3004) and broadcasts
  them to specific users via their WebSocket connections
- Runs cron jobs: price alert checks (every 10s), P2P trade cleanup (every 1m)
- **Security**: HTTP push endpoints require `INTERNAL_SECRET` header;
  WebSocket auth uses short-lived single-use WS tokens (not session cookies)

### 3. Database
- **Dev**: SQLite (single file at `/app/db/custom.db`)
- **Prod**: PostgreSQL (recommended — set `DATABASE_URL` to a `postgresql://` URL)
- Schema managed by Prisma (`prisma/schema.prisma`)
- Migrations: `prisma migrate deploy` in production (never `db push --accept-data-loss`)

## Security Architecture

### Authentication Flow
1. User submits credentials to `/api/auth/login`
2. Server verifies password (scrypt hash, legacy SHA-512 auto-upgraded)
3. If 2FA enabled: require TOTP code (RFC 6238) or backup code
4. On success: create `Session` row (DB-backed, 7-day TTL), set httpOnly cookie
5. Subsequent requests: cookie → `getAuthUser()` → `Session` table lookup

### Authorization Layers
- `getAuthUser(req)` — returns user or null (for user endpoints)
- `requireAdmin(req)` — returns user only if role === 'ADMIN' (for admin endpoints)
- `requireVerified(req)` — returns 403 if email/phone not verified (when Settings enforces it)
- IDOR protection: every endpoint checks `resource.userId === user.id` before
  returning/modifying user-owned resources

### Money Movement Safety
All money operations use `db.$transaction(async (tx) => { ... })` with:
- Fresh balance read **inside** the transaction (prevents TOCTOU races)
- Conditional `updateMany` on status fields (prevents double-processing)
- Transaction log row created in the same atomic block

### Secrets Management
Required environment variables (see `.env.example`):
- `DATABASE_URL` — DB connection string
- `BOOTSTRAP_ADMIN_TOKEN` — one-time admin creation (≥32 chars)
- `INTERNAL_SECRET` — Next.js ↔ ticker-service auth (≥32 chars)
- `CRON_SECRET` — ticker-service → Next.js cron endpoints (≥32 chars)
- `ALLOWED_ORIGINS` — comma-separated list for WebSocket CORS
- Optional: `SMTP_*`, `VAPID_*`, `GEOLITE2_CITY_DB`, `CSP_REPORT_URI`

## Deployment

### Docker (Recommended)
```bash
# 1. Copy .env.example to .env and fill in secrets
cp .env.example .env
# Generate secrets:
node -e "console.log('INTERNAL_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# 2. Build + start
docker compose up -d --build

# 3. Check health
curl http://localhost:3000/
curl http://localhost:3004/health

# 4. Create admin (one-time)
curl -X POST http://localhost:3000/api/seed \
  -H "Content-Type: application/json" \
  -d '{"bootstrapToken":"YOUR_BOOTSTRAP_ADMIN_TOKEN","email":"admin@example.com","password":"...","username":"admin"}'
```

### Manual (without Docker)
```bash
npm install
npx prisma generate
npx prisma db push
npm run build
npm start
# In a separate terminal:
npx tsx mini-services/ticker-service/index.ts
```

### Database Backups
```bash
# Manual backup
npm run backup

# Cron (daily at 2 AM, keep 30 days)
0 2 * * * cd /app && npm run backup
```

## Development

### Commands
```bash
npm run dev          # Start dev server (port 3000)
npm run lint         # ESLint
npx tsc --noEmit     # TypeScript check
npm test             # Integration tests
npm run db:push      # Apply schema changes to DB
npm run db:generate  # Regenerate Prisma client
npm run backup       # Backup database
```

### Testing
Integration tests (`tests/money.test.ts`) verify money-movement atomicity,
password hashing, OTP generation, and safe JSON parsing against a real DB.

```bash
npm test
```

### Adding a New API Route
1. Create `src/app/api/<path>/route.ts`
2. Use zod schema from `src/lib/schemas.ts` for input validation
3. Use `getAuthUser(req)` / `requireAdmin(req)` / `requireVerified(req)` for auth
4. Use `creditEgp`/`debitEgp`/`creditUsdt`/`debitUsdt` for money operations
5. Use `createNotification()` + `pushBalanceUpdate()` for real-time updates
6. Use `logger` from `src/lib/logger.ts` for structured logging
7. Use `t()` from `src/lib/i18n.ts` for user-facing error messages

## Monitoring

### Health Checks
- Next.js: `GET /` (returns 200 if app is up)
- Ticker-service: `GET /health` (returns 200 if price fetch < 60s ago)

### Logging
- **Dev**: pretty-printed to console
- **Prod**: JSON lines (parseable by Datadog, ELK, etc.)
- Levels: `debug`, `info`, `warn`, `error` (controlled by `LOG_LEVEL` env)

### CSP Violation Reports
Set `CSP_REPORT_URI` env var to collect Content Security Policy violation
reports (e.g., to a service like report-uri.com).

## File Structure
```
eg-money/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/                # API routes
│   │   │   ├── auth/           # Auth endpoints (login, signup, 2FA, sessions)
│   │   │   ├── admin/          # Admin-only endpoints
│   │   │   ├── p2p/            # P2P trade endpoints
│   │   │   ├── deposits/       # Deposit endpoints
│   │   │   └── ...
│   │   └── ...                 # Pages
│   ├── lib/                    # Shared libraries
│   │   ├── auth.ts             # Password hashing + session management
│   │   ├── session.ts          # getAuthUser / requireAdmin
│   │   ├── money.ts            # Atomic money helpers + Settings
│   │   ├── db.ts               # Prisma client
│   │   ├── schemas.ts          # Zod validation schemas
│   │   ├── totp.ts             # 2FA/TOTP (RFC 6238)
│   │   ├── otp.ts              # OTP issuance helper
│   │   ├── i18n.ts             # Error message translations
│   │   ├── logger.ts           # Structured logger
│   │   ├── rate-limit.ts       # Generic rate limiter
│   │   ├── geoip.ts            # GeoIP lookup (MaxMind GeoLite2)
│   │   ├── safe-json.ts        # safeJsonParse helper
│   │   ├── ticker-client.ts    # Internal HTTP client for ticker-service
│   │   └── ...
│   ├── components/             # React components
│   └── hooks/                  # React hooks
├── prisma/
│   └── schema.prisma           # Database schema
├── mini-services/
│   └── ticker-service/         # Ticker + WebSocket service
├── scripts/
│   ├── reset-admin.ts          # CLI admin creation
│   └── backup-db.ts            # Database backup script
├── tests/
│   └── money.test.ts           # Integration tests
├── public/                     # Static assets (NO receipts — those are in /uploads)
├── Dockerfile
├── docker-compose.yml
├── Caddyfile                   # Reverse proxy config
└── .env.example                # Environment variable template
```
