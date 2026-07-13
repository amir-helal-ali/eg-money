import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Logging: only log queries in development. In production, query logging
// is noisy, slows down the app, and leaks DB structure into log aggregators.
const logConfig =
  process.env.NODE_ENV === 'production'
    ? ['error', 'warn']
    : ['query', 'error', 'warn']

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logConfig as any,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db