import { NextResponse, type NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'
import { isDatabaseConfigured, isProduction } from '@/lib/env'
import {
  checkRateLimit,
  getRateLimitRule,
  rateLimitKey,
} from '@/lib/rate-limit'
import { safeRelativeRedirect } from '@/lib/redirects'
import {
  applySecurityHeaders,
  isMutationMethod,
  isTrustedMutationOrigin,
} from '@/lib/security'

const publicPaths = ['/sign-in', '/sign-up']

function requestIp(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

function responseWithSecurity(response: NextResponse, request: NextRequest) {
  const rule = getRateLimitRule(request.nextUrl.pathname, request.method)
  const rateLimit = checkRateLimit(
    rateLimitKey({
      ip: requestIp(request),
      pathname: request.nextUrl.pathname,
      method: request.method,
    }),
    rule,
  )

  const nextResponse = rateLimit.allowed
    ? response
    : NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })

  nextResponse.headers.set('X-RateLimit-Limit', String(rule.limit))
  nextResponse.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining))
  nextResponse.headers.set(
    'X-RateLimit-Reset',
    new Date(rateLimit.resetAt).toISOString(),
  )
  applySecurityHeaders(nextResponse.headers)

  return nextResponse
}

function nextWithPathname(request: NextRequest) {
  const headers = new Headers(request.headers)
  headers.set('x-agentgate-pathname', request.nextUrl.pathname)
  return NextResponse.next({ request: { headers } })
}

function requiresOriginCheck(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (!pathname.startsWith('/api/')) return false
  if (!isMutationMethod(request.method)) return false
  if (pathname.startsWith('/api/auth')) return false
  if (pathname.startsWith('/api/jobs')) return false
  if (pathname.includes('/webhook')) return false
  return true
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (requiresOriginCheck(request) && !isTrustedMutationOrigin(request)) {
    return responseWithSecurity(
      NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 }),
      request,
    )
  }

  if (pathname.startsWith('/api/')) {
    return responseWithSecurity(nextWithPathname(request), request)
  }

  if (
    publicPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  ) {
    return responseWithSecurity(nextWithPathname(request), request)
  }

  if (!isProduction() && !isDatabaseConfigured()) {
    return responseWithSecurity(nextWithPathname(request), request)
  }

  const sessionCookie = getSessionCookie(request.headers)
  if (sessionCookie) return responseWithSecurity(nextWithPathname(request), request)

  const signInUrl = request.nextUrl.clone()
  signInUrl.pathname = '/sign-in'
  signInUrl.searchParams.set(
    'callbackUrl',
    safeRelativeRedirect(`${pathname}${request.nextUrl.search}`),
  )

  return responseWithSecurity(NextResponse.redirect(signInUrl), request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
