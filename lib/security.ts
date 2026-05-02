export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
} as const

const mutationMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export function applySecurityHeaders(headers: Headers) {
  for (const [key, value] of Object.entries(securityHeaders)) {
    headers.set(key, value)
  }

  if (process.env.NODE_ENV === 'production') {
    headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload',
    )
  }

  return headers
}

export function isMutationMethod(method: string) {
  return mutationMethods.has(method.toUpperCase())
}

function sameOrigin(left: string, right: string) {
  try {
    return new URL(left).origin === new URL(right).origin
  } catch {
    return false
  }
}

export function isTrustedMutationOrigin(request: Request) {
  if (!isMutationMethod(request.method)) return true

  const origin = request.headers.get('origin')
  if (origin) return sameOrigin(origin, request.url)

  const referer = request.headers.get('referer')
  return Boolean(referer && sameOrigin(referer, request.url))
}
