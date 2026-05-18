import { betterAuth } from 'better-auth'
import { dash } from '@better-auth/infra'
import { prismaAdapter } from '@better-auth/prisma-adapter'
import { getBetterAuthSecret, getBetterAuthUrl, isProduction } from '@/lib/env'
import {
  isEmailDeliveryConfigured,
  sendTransactionalEmail,
} from '@/lib/email'
import { getPrismaClient } from '@/lib/prisma'

const betterAuthUrl = getBetterAuthUrl()
const prisma = getPrismaClient()

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
    requireEmailVerification: isProduction() || isEmailDeliveryConfigured(),
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
    sendOnSignUp: true,
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendTransactionalEmail({
        to: user.email,
        subject: 'Verify your AgentGate email',
        text: `Verify your AgentGate email address: ${url}`,
      })
    },
  },
  trustedOrigins: [betterAuthUrl],
  plugins: [
    dash({
      apiUrl: process.env.BETTER_AUTH_API_URL,
      kvUrl: process.env.BETTER_AUTH_KV_URL,
      apiKey: process.env.BETTER_AUTH_API_KEY,
    }),
  ],
})
