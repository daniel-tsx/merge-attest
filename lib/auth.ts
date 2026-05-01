import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { getBetterAuthSecret, getBetterAuthUrl } from "@/lib/env";
import { getPrismaClient } from "@/lib/prisma";

const betterAuthUrl = getBetterAuthUrl();
const prisma = getPrismaClient();

export const auth = betterAuth({
  ...(prisma
    ? {
        database: prismaAdapter(prisma, {
          provider: "postgresql",
        }),
      }
    : {}),
  baseURL: betterAuthUrl,
  secret: getBetterAuthSecret(),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [betterAuthUrl],
});
