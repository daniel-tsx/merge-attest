type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogArea =
  | 'auth'
  | 'github'
  | 'approval'
  | 'billing'
  | 'jobs'
  | 'health'
  | 'security'

type LogMetadata = Record<string, string | number | boolean | null | undefined>

function runtimeContext() {
  return {
    environment: process.env.NODE_ENV ?? 'development',
    release:
      process.env.VERCEL_GIT_COMMIT_SHA ??
      process.env.APP_VERSION ??
      process.env.NEXT_PUBLIC_APP_VERSION ??
      'local',
  }
}

function errorMetadata(error: unknown): LogMetadata {
  if (!(error instanceof Error)) return { error: String(error) }

  return {
    errorName: error.name,
    errorMessage: error.message,
    errorStack: error.stack,
  }
}

export function logEvent(input: {
  level?: LogLevel
  area: LogArea
  action: string
  message: string
  metadata?: LogMetadata
}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level: input.level ?? 'info',
    area: input.area,
    action: input.action,
    message: input.message,
    ...runtimeContext(),
    metadata: input.metadata ?? {},
  }

  const line = JSON.stringify(payload)
  if (payload.level === 'error') console.error(line)
  else if (payload.level === 'warn') console.warn(line)
  else console.log(line)
}

export function reportError(input: {
  area: LogArea
  action: string
  error: unknown
  metadata?: LogMetadata
}) {
  logEvent({
    level: 'error',
    area: input.area,
    action: input.action,
    message:
      input.error instanceof Error
        ? input.error.message
        : 'Unexpected application error',
    metadata: {
      ...input.metadata,
      ...errorMetadata(input.error),
    },
  })
}

export function getErrorTrackingContext() {
  return runtimeContext()
}
