export type RateLimitRule = {
  limit: number
  windowMs: number
}

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export const rateLimitRules = {
  public: { limit: 120, windowMs: 60_000 },
  auth: { limit: 30, windowMs: 60_000 },
  webhook: { limit: 300, windowMs: 60_000 },
  mutation: { limit: 90, windowMs: 60_000 },
} satisfies Record<string, RateLimitRule>

export function checkRateLimit(
  key: string,
  rule: RateLimitRule,
  now = Date.now(),
) {
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    const bucket = { count: 1, resetAt: now + rule.windowMs }
    buckets.set(key, bucket)
    return {
      allowed: true,
      remaining: rule.limit - 1,
      resetAt: bucket.resetAt,
    }
  }

  if (existing.count >= rule.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    }
  }

  existing.count += 1
  return {
    allowed: true,
    remaining: rule.limit - existing.count,
    resetAt: existing.resetAt,
  }
}

export function getRateLimitRule(pathname: string, method: string) {
  if (pathname.startsWith('/api/auth')) return rateLimitRules.auth
  if (pathname.includes('/webhook')) return rateLimitRules.webhook
  if (method !== 'GET' && method !== 'HEAD') return rateLimitRules.mutation
  return rateLimitRules.public
}

export function rateLimitKey(input: {
  ip?: string | null
  pathname: string
  method: string
}) {
  return `${input.ip || 'unknown'}:${input.method}:${input.pathname}`
}

export function clearRateLimitBuckets() {
  buckets.clear()
}
