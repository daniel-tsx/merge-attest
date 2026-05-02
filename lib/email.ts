import { isProduction } from '@/lib/env'

type Env = Record<string, string | undefined>

export type TransactionalEmail = {
  to: string
  subject: string
  text: string
}

function readEnv(name: string, env: Env) {
  const value = env[name]?.trim()
  return value ? value : undefined
}

export function getEmailFrom(env: Env = process.env) {
  return readEnv('EMAIL_FROM', env)
}

export function getResendApiKey(env: Env = process.env) {
  return readEnv('RESEND_API_KEY', env)
}

export function isEmailDeliveryConfigured(env: Env = process.env) {
  return Boolean(getEmailFrom(env) && getResendApiKey(env))
}

export function getEmailDeliveryMode(env: Env = process.env) {
  if (isEmailDeliveryConfigured(env)) return 'live'
  return isProduction(env) ? 'unconfigured' : 'mock'
}

export async function sendTransactionalEmail(
  email: TransactionalEmail,
  env: Env = process.env,
) {
  const from = getEmailFrom(env)
  const apiKey = getResendApiKey(env)

  if (!from || !apiKey) {
    if (isProduction(env)) {
      throw new Error('Transactional email delivery is not configured.')
    }

    console.info('Mock transactional email:', email)
    return { mode: 'mock' as const }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: email.to,
      subject: email.subject,
      text: email.text,
    }),
  })

  if (!response.ok) {
    throw new Error(`Transactional email failed with ${response.status}.`)
  }

  return { mode: 'live' as const }
}
