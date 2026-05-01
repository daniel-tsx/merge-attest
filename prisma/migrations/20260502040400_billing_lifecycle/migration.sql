-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('trialing', 'active', 'past_due', 'paused', 'canceled');

-- AlterTable
ALTER TABLE "Organization"
ADD COLUMN "billingStatus" "BillingStatus" NOT NULL DEFAULT 'active',
ADD COLUMN "trialEndsAt" TIMESTAMP(3),
ADD COLUMN "cancellationEffectiveAt" TIMESTAMP(3),
ADD COLUMN "failedPaymentAt" TIMESTAMP(3),
ADD COLUMN "lastUpgradeAt" TIMESTAMP(3);
