import { betterAuth } from "better-auth";
import { getBetterAuthSecret, getBetterAuthUrl } from "@/lib/env";

const betterAuthUrl = getBetterAuthUrl();

export const auth = betterAuth({
  baseURL: betterAuthUrl,
  secret: getBetterAuthSecret(),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [betterAuthUrl],
});
