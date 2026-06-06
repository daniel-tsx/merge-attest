import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/lib/generated/prisma/client'
import { getDatabaseUrl, validateProductionEnv } from '@/lib/env'

const globalForPrisma = globalThis as typeof globalThis & {
  auteurPrisma?: PrismaClient
  auteurPrismaUrl?: string
}

export function getPrismaClient() {
  validateProductionEnv()

  const databaseUrl = getDatabaseUrl()
  if (!databaseUrl) return null

  if (
    !globalForPrisma.auteurPrisma ||
    globalForPrisma.auteurPrismaUrl !== databaseUrl
  ) {
    const adapter = new PrismaPg({ connectionString: databaseUrl })
    globalForPrisma.auteurPrisma = new PrismaClient({ adapter })
    globalForPrisma.auteurPrismaUrl = databaseUrl
  }

  return globalForPrisma.auteurPrisma
}
