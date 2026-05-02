import { isProduction } from '@/lib/env'

export function authorizeJobRequest(request: Request) {
  const secret = process.env.JOB_RUNNER_SECRET?.trim()
  if (!secret) {
    return isProduction()
      ? { ok: false as const, status: 503, message: 'Job runner secret is not configured.' }
      : { ok: true as const }
  }

  const authorization = request.headers.get('authorization')
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null

  return token === secret
    ? { ok: true as const }
    : { ok: false as const, status: 401, message: 'Invalid job runner token.' }
}
