import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/lib/generated/prisma/client'
import { getDatabaseUrl, validateProductionEnv } from '@/lib/env'

const globalForPrisma = globalThis as typeof globalThis & {
  mergeattestPrisma?: PrismaClient
  mergeattestPrismaUrl?: string
}

export function getPrismaClient() {
  validateProductionEnv()

  const databaseUrl = getDatabaseUrl()
  if (!databaseUrl) return null

  if (
    !globalForPrisma.mergeattestPrisma ||
    globalForPrisma.mergeattestPrismaUrl !== databaseUrl
  ) {
    const adapter = new PrismaPg({ connectionString: databaseUrl })
    globalForPrisma.mergeattestPrisma = new PrismaClient({ adapter })
    globalForPrisma.mergeattestPrismaUrl = databaseUrl
  }

  return globalForPrisma.mergeattestPrisma
}
