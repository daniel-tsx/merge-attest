import { betterAuth } from 'better-auth'
import { dash } from '@better-auth/infra'
import { prismaAdapter } from '@better-auth/prisma-adapter'
import { getBetterAuthSecret, getBetterAuthUrl } from '@/lib/env'
import { isEmailDeliveryConfigured, sendTransactionalEmail } from '@/lib/email'
import { getPrismaClient } from '@/lib/prisma'

const betterAuthUrl = getBetterAuthUrl()
const prisma = getPrismaClient()
const emailDeliveryConfigured = isEmailDeliveryConfigured()
const trustedOrigins = Array.from(
  new Set([betterAuthUrl, 'https://dash.better-auth.com']),
)

export const auth = betterAuth({
  ...(prisma
    ? {
        database: prismaAdapter(prisma, {
          provider: 'postgresql',
        }),
      }
    : {}),
  baseURL: betterAuthUrl,
  secret: getBetterAuthSecret(),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: emailDeliveryConfigured,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendTransactionalEmail({
        to: user.email,
        subject: 'Reset your AgentGate password',
        text: `Reset your AgentGate password: ${url}`,
      })
    },
  },
  emailVerification: {
    sendOnSignUp: emailDeliveryConfigured,
    sendOnSignIn: emailDeliveryConfigured,
    sendVerificationEmail: async ({ user, url }) => {
      await sendTransactionalEmail({
        to: user.email,
        subject: 'Verify your AgentGate email',
        text: `Verify your AgentGate email address: ${url}`,
      })
    },
  },
  trustedOrigins,
  plugins: [
    dash({
      apiKey: process.env.BETTER_AUTH_API_KEY,
    }),
  ],
})
