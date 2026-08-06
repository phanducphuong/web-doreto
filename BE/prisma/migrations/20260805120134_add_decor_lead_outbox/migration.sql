-- CreateTable
CREATE TABLE "decor_lead_outbox" (
    "id" UUID NOT NULL,
    "sourceKind" TEXT NOT NULL,
    "sourceId" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decor_lead_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "decor_lead_outbox_status_nextAttemptAt_idx" ON "decor_lead_outbox"("status", "nextAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "decor_lead_outbox_sourceKind_sourceId_key" ON "decor_lead_outbox"("sourceKind", "sourceId");
