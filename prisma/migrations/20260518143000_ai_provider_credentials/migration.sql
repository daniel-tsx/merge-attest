-- CreateTable
CREATE TABLE "AiProviderCredential" (
    "id" TEXT NOT NULL,
    "provider" "AiReviewProvider" NOT NULL DEFAULT 'openrouter',
    "encryptedKey" TEXT NOT NULL,
    "lastVerifiedAt" TIMESTAMP(3),
    "userId" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiProviderCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiProviderCredential_organizationId_provider_key" ON "AiProviderCredential"("organizationId", "provider");

-- CreateIndex
CREATE INDEX "AiProviderCredential_organizationId_idx" ON "AiProviderCredential"("organizationId");

-- CreateIndex
CREATE INDEX "AiProviderCredential_userId_idx" ON "AiProviderCredential"("userId");

-- AddForeignKey
ALTER TABLE "AiProviderCredential" ADD CONSTRAINT "AiProviderCredential_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiProviderCredential" ADD CONSTRAINT "AiProviderCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
