-- AlterTable
ALTER TABLE "contact_requests" ADD COLUMN     "camp" TEXT,
ADD COLUMN     "utm" JSONB,
ADD COLUMN     "visitorId" UUID;

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "camp" TEXT,
ADD COLUMN     "utm" JSONB,
ADD COLUMN     "visitorId" UUID;

-- CreateTable
CREATE TABLE "visitor_sessions" (
    "id" UUID NOT NULL,
    "visitorId" UUID NOT NULL,
    "camp" TEXT,
    "utm" JSONB,
    "landingUrl" TEXT,
    "referrer" TEXT,
    "userAgent" TEXT,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitor_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_views" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "visitorId" UUID NOT NULL,
    "camp" TEXT,
    "path" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor_events" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "visitorId" UUID NOT NULL,
    "camp" TEXT,
    "type" TEXT NOT NULL,
    "productId" UUID,
    "orderId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitor_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_daily_reports" (
    "id" UUID NOT NULL,
    "date" TEXT NOT NULL,
    "camp" TEXT NOT NULL DEFAULT '',
    "sessionCount" INTEGER NOT NULL DEFAULT 0,
    "visitorCount" INTEGER NOT NULL DEFAULT 0,
    "pageViewCount" INTEGER NOT NULL DEFAULT 0,
    "productViewCount" INTEGER NOT NULL DEFAULT 0,
    "addToCartCount" INTEGER NOT NULL DEFAULT 0,
    "beginCheckoutCount" INTEGER NOT NULL DEFAULT 0,
    "orderSuccessCount" INTEGER NOT NULL DEFAULT 0,
    "contactFormCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visit_daily_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "visitor_sessions_visitorId_idx" ON "visitor_sessions"("visitorId");

-- CreateIndex
CREATE INDEX "visitor_sessions_camp_idx" ON "visitor_sessions"("camp");

-- CreateIndex
CREATE INDEX "visitor_sessions_createdAt_idx" ON "visitor_sessions"("createdAt");

-- CreateIndex
CREATE INDEX "page_views_sessionId_idx" ON "page_views"("sessionId");

-- CreateIndex
CREATE INDEX "page_views_visitorId_idx" ON "page_views"("visitorId");

-- CreateIndex
CREATE INDEX "page_views_camp_idx" ON "page_views"("camp");

-- CreateIndex
CREATE INDEX "page_views_createdAt_idx" ON "page_views"("createdAt");

-- CreateIndex
CREATE INDEX "visitor_events_sessionId_idx" ON "visitor_events"("sessionId");

-- CreateIndex
CREATE INDEX "visitor_events_visitorId_idx" ON "visitor_events"("visitorId");

-- CreateIndex
CREATE INDEX "visitor_events_camp_idx" ON "visitor_events"("camp");

-- CreateIndex
CREATE INDEX "visitor_events_type_createdAt_idx" ON "visitor_events"("type", "createdAt");

-- CreateIndex
CREATE INDEX "visit_daily_reports_date_idx" ON "visit_daily_reports"("date");

-- CreateIndex
CREATE UNIQUE INDEX "visit_daily_reports_date_camp_key" ON "visit_daily_reports"("date", "camp");

-- CreateIndex
CREATE INDEX "contact_requests_visitorId_idx" ON "contact_requests"("visitorId");

-- CreateIndex
CREATE INDEX "purchase_orders_visitorId_idx" ON "purchase_orders"("visitorId");

-- AddForeignKey
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "visitor_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_events" ADD CONSTRAINT "visitor_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "visitor_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
