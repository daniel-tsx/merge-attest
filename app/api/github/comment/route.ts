import { NextResponse } from 'next/server'
import { pullRequests } from '@/lib/demo-data'
import { isProduction } from '@/lib/env'
import { postPullRequestComment } from '@/lib/github'

function methodNotAllowed() {
  return NextResponse.json(
    { error: 'Use POST for this demo-only comment helper.' },
    { status: 405, headers: { Allow: 'POST' } },
  )
}

export async function GET() {
  return methodNotAllowed()
}

export async function POST() {
  if (isProduction()) {
    return NextResponse.json(
      { error: 'The demo GitHub comment helper is disabled in production.' },
      { status: 403 },
    )
  }

  const pr = pullRequests[0]
  const result = await postPullRequestComment(
    pr,
    `Auteur risk score: ${pr.riskScore} (${pr.riskLevel})`,
  )

  return NextResponse.json(result)
}
