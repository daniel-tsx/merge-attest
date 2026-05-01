-- CreateTable
CREATE TABLE "AuditExport" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'csv',
    "filters" JSONB NOT NULL DEFAULT '{}',
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditExport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditExport_organizationId_createdAt_idx" ON "AuditExport"("organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "AuditExport" ADD CONSTRAINT "AuditExport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditExport" ADD CONSTRAINT "AuditExport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
