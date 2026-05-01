import { NextResponse, type NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'
import { isDatabaseConfigured, isProduction } from '@/lib/env'
import {
  checkRateLimit,
  getRateLimitRule,
  rateLimitKey,
} from '@/lib/rate-limit'
import { applySecurityHeaders } from '@/lib/security'

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/')) {
    return responseWithSecurity(NextResponse.next(), request)
  }

  if (
    publicPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  ) {
    return responseWithSecurity(NextResponse.next(), request)
  }

  if (!isProduction() && !isDatabaseConfigured()) {
    return responseWithSecurity(NextResponse.next(), request)
  }

  const sessionCookie = getSessionCookie(request.headers)
  if (sessionCookie) return responseWithSecurity(NextResponse.next(), request)

  const signInUrl = request.nextUrl.clone()
  signInUrl.pathname = '/sign-in'
  signInUrl.searchParams.set(
    'callbackUrl',
    `${pathname}${request.nextUrl.search}`,
  )

  return responseWithSecurity(NextResponse.redirect(signInUrl), request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
