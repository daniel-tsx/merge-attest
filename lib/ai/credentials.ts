import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto'
import { getBetterAuthSecret } from '@/lib/env'
import { getPrismaClient } from '@/lib/prisma'

const algorithm = 'aes-256-gcm'
const encodingVersion = 'v1'

function encryptionSecret(
  env: Record<string, string | undefined> = process.env,
) {
  return env.AI_PROVIDER_ENCRYPTION_KEY?.trim() || getBetterAuthSecret(env)
}

function encryptionKey(env?: Record<string, string | undefined>) {
  return createHash('sha256').update(encryptionSecret(env)).digest()
}

export function encryptProviderKey(
  plaintext: string,
  env?: Record<string, string | undefined>,
) {
  const iv = randomBytes(12)
  const cipher = createCipheriv(algorithm, encryptionKey(env), iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  return [
    encodingVersion,
    iv.toString('base64url'),
    authTag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join(':')
}

export function decryptProviderKey(
  encryptedKey: string,
  env?: Record<string, string | undefined>,
) {
  const [version, ivValue, authTagValue, encryptedValue] =
    encryptedKey.split(':')
  if (
    version !== encodingVersion ||
    !ivValue ||
    !authTagValue ||
    !encryptedValue
  ) {
    throw new Error('Unsupported encrypted provider key format.')
  }

  const decipher = createDecipheriv(
    algorithm,
    encryptionKey(env),
    Buffer.from(ivValue, 'base64url'),
  )
  decipher.setAuthTag(Buffer.from(authTagValue, 'base64url'))

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}

export function redactSecret(value: string) {
  const trimmed = value.trim()
  if (trimmed.length <= 8) return '********'

  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`
}

export async function getOrganizationOpenRouterCredential(
  organizationId: string,
) {
  const prisma = getPrismaClient()
  if (!prisma) return null

  return prisma.aiProviderCredential.findUnique({
    where: {
      organizationId_provider: {
        organizationId,
        provider: 'openrouter',
      },
    },
  })
}
