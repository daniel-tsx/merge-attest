import { toNextJsHandler } from 'better-auth/next-js'
import { auth } from '@/lib/auth'

const dashOrigin = 'https://dash.better-auth.com'
const handlers = toNextJsHandler(auth.handler)

function applyDashCors(response: Response, request: Request) {
  if (request.headers.get('origin') !== dashOrigin) return response

  response.headers.set('Access-Control-Allow-Origin', dashOrigin)
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set(
    'Access-Control-Allow-Headers',
    'authorization, content-type',
  )
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.append('Vary', 'Origin')
  return response
}

export async function GET(request: Request) {
  return applyDashCors(await handlers.GET(request), request)
}

export async function POST(request: Request) {
  return applyDashCors(await handlers.POST(request), request)
}

export function OPTIONS(request: Request) {
  return applyDashCors(new Response(null, { status: 204 }), request)
}
