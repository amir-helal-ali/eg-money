# ===== Eg-Money Production Dockerfile =====
# Multi-stage build: install deps → build → minimal runtime image
#
# Build:  docker build -t eg-money .
# Run:    docker run -p 3000:3000 --env-file .env eg-money
#
# Or use docker-compose:
#   docker compose up -d                    # production
#   docker compose -f docker-compose.dev.yml up  # development

# ===== Stage 1: Install dependencies =====
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

# ===== Stage 2: Build the Next.js app =====
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Set NEXT_PUBLIC_BASE_URL at build time if provided
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL

# Build the Next.js app (standalone output)
RUN npm run build

# ===== Stage 3: Ticker service deps =====
FROM node:20-alpine AS ticker-deps
WORKDIR /ticker
COPY mini-services/ticker-service/package.json ./
RUN npm install --omit=dev

# ===== Stage 4: Production runtime =====
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Install runtime dependencies + tsx for ticker-service
RUN apk add --no-cache libc6-compat
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN npm install -g tsx

# Copy the standalone Next.js build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files (needed for runtime DB access)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy the ticker-service
COPY --chown=nextjs:nodejs mini-services/ticker-service ./ticker-service
COPY --from=ticker-deps --chown=nextjs:nodejs /ticker/node_modules ./ticker-service/node_modules

# Copy the startup script
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Create data directory for SQLite
RUN mkdir -p /app/db && chown nextjs:nodejs /app/db

USER nextjs

EXPOSE 3000 3003 3004

# Healthcheck — polls the homepage every 30s
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
