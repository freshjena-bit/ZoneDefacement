import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// If a previously-cached client exists but is missing the current model
// (e.g. schema changed after dev server start), discard it and create a new
// one. This makes iterative schema changes survive hot reloads without
// requiring a manual dev-server restart.
let cached = globalForPrisma.prisma
if (cached && !(cached as any).defacement) {
  cached = undefined
  globalForPrisma.prisma = undefined
}

export const db =
  cached ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Debug marker to confirm this module has been re-evaluated after schema changes.
export const __DB_MODULE_VERSION = 'zonedefacement-v1'
