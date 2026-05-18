import { z } from 'zod'

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
export const MAX_OPENROUTER_KEY_LENGTH = 4096

const currentKeySchema = z.object({
  data: z.object({
    label: z.string().optional(),
    limit_remaining: z.number().nullable().optional(),
    is_free_tier: z.boolean().optional(),
  }),
})

const modelsSchema = z.object({
  data: z.array(z.object({ id: z.string() })),
})

export type OpenRouterVerification = {
  valid: boolean
  modelCount: number
  message: string
}

export function normalizeOpenRouterKey(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

function authHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    'HTTP-Referer': process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
    'X-Title': 'AgentGate',
  }
}

async function fetchJson(
  path: string,
  apiKey: string,
  fetchImpl: typeof fetch,
) {
  return fetchImpl(`${OPENROUTER_BASE_URL}${path}`, {
    headers: authHeaders(apiKey),
    cache: 'no-store',
  })
}

export async function verifyOpenRouterKey(
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<OpenRouterVerification> {
  const key = normalizeOpenRouterKey(apiKey)
  if (!key) {
    return {
      valid: false,
      modelCount: 0,
      message: 'OpenRouter API key is required.',
    }
  }
  if (key.length > MAX_OPENROUTER_KEY_LENGTH) {
    return {
      valid: false,
      modelCount: 0,
      message: 'OpenRouter API key is too long.',
    }
  }

  try {
    const keyResponse = await fetchJson('/key', key, fetchImpl)
    if (keyResponse.status === 401 || keyResponse.status === 403) {
      return {
        valid: false,
        modelCount: 0,
        message: 'OpenRouter rejected this API key.',
      }
    }
    if (!keyResponse.ok) {
      return {
        valid: false,
        modelCount: 0,
        message: 'OpenRouter key verification failed.',
      }
    }

    currentKeySchema.parse(await keyResponse.json())

    const modelsResponse = await fetchJson('/models/user', key, fetchImpl)
    if (!modelsResponse.ok) {
      return {
        valid: true,
        modelCount: 0,
        message:
          'OpenRouter key is valid, but model access could not be counted.',
      }
    }

    const models = modelsSchema.parse(await modelsResponse.json())
    return {
      valid: true,
      modelCount: models.data.length,
      message: `OpenRouter key verified with access to ${models.data.length} models.`,
    }
  } catch {
    return {
      valid: false,
      modelCount: 0,
      message: 'OpenRouter key verification failed.',
    }
  }
}
