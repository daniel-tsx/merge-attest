import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/lib/generated/prisma/client'
import { getDatabaseUrl } from '@/lib/env'

const globalForPrisma = globalThis as typeof globalThis & {
  agentGatePrisma?: PrismaClient
  agentGatePrismaUrl?: string
}

export function getPrismaClient() {
  const databaseUrl = getDatabaseUrl()
  if (!databaseUrl) return null

  if (
    !globalForPrisma.agentGatePrisma ||
    globalForPrisma.agentGatePrismaUrl !== databaseUrl
  ) {
    const adapter = new PrismaPg({ connectionString: databaseUrl })
    globalForPrisma.agentGatePrisma = new PrismaClient({ adapter })
    globalForPrisma.agentGatePrismaUrl = databaseUrl
  }

  return globalForPrisma.agentGatePrisma
}
