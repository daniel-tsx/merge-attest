type Env = Record<string, string | undefined>

const LOCAL_BETTER_AUTH_SECRET =
  'agentgate-local-development-secret-change-before-production'

export function isProduction(env: Env = process.env) {
  return env.NODE_ENV === 'production'
}

function readEnv(name: string, env: Env) {
  const value = env[name]?.trim()
  return value ? value : undefined
}

export function getBetterAuthUrl(env: Env = process.env) {
  return readEnv('BETTER_AUTH_URL', env) ?? 'http://localhost:3000'
}

export function getBetterAuthSecret(env: Env = process.env) {
  const secret = readEnv('BETTER_AUTH_SECRET', env)
  if (secret) return secret

  if (isProduction(env)) {
    throw new Error('BETTER_AUTH_SECRET is required in production.')
  }

  return LOCAL_BETTER_AUTH_SECRET
}

export function getGitHubWebhookSecret(env: Env = process.env) {
  return readEnv('GITHUB_WEBHOOK_SECRET', env)
}

export function getDatabaseUrl(env: Env = process.env) {
  return readEnv('DATABASE_URL', env)
}

export function isDatabaseConfigured(env: Env = process.env) {
  return Boolean(getDatabaseUrl(env))
}

export function validateProductionEnv(env: Env = process.env) {
  if (!isProduction(env)) return

  const missing = [
    'DATABASE_URL',
    'BETTER_AUTH_SECRET',
    'GITHUB_WEBHOOK_SECRET',
  ].filter((name) => !readEnv(name, env))
  if (missing.length) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(', ')}`,
    )
  }
}
