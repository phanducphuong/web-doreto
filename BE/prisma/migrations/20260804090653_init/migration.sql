-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'customer');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('cart', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

-- CreateEnum
CREATE TYPE "ContactSpamKind" AS ENUM ('email', 'phone');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "refreshToken" TEXT,
    "role" "Role" NOT NULL DEFAULT 'customer',
    "phoneNumber" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "addressName" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "detailedAddress" TEXT NOT NULL,
    "ward" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT DEFAULT 'Việt Nam',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" UUID,
    "order" INTEGER DEFAULT 0,
    "icon" TEXT,
    "description" TEXT DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "normalizedName" TEXT NOT NULL DEFAULT '',
    "minPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "purchaseCount" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "productOptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "thumbnailUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "option_values" (
    "id" UUID NOT NULL,
    "productId" UUID,
    "imageUrl" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "originalPrice" DOUBLE PRECISION,
    "purchaseCount" INTEGER DEFAULT 0,
    "stock" INTEGER DEFAULT 0,
    "productOptionNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "option_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "productId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("productId","categoryId")
);

-- CreateTable
CREATE TABLE "product_tags" (
    "productId" UUID NOT NULL,
    "tagId" UUID NOT NULL,

    CONSTRAINT "product_tags_pkey" PRIMARY KEY ("productId","tagId")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'pending',
    "summaryPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nonLoginUserEmail" TEXT,
    "address" JSONB,
    "deliveriedAt" TIMESTAMP(3),
    "isFeedbacked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_items" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "productOptionValueId" UUID NOT NULL,
    "count" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "product" JSONB,
    "productOptionValue" JSONB,

    CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_products" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "purchaseOrderId" UUID NOT NULL,
    "comment" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "score" INTEGER,
    "adminReply" TEXT,
    "replyImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "repliedBy" UUID,
    "repliedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_requests" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_spam_blocks" (
    "id" UUID NOT NULL,
    "kind" "ContactSpamKind" NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_spam_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_daily_reports" (
    "id" UUID NOT NULL,
    "date" TEXT NOT NULL,
    "pendingCount" INTEGER NOT NULL DEFAULT 0,
    "confirmedCount" INTEGER NOT NULL DEFAULT 0,
    "shippedCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "cancelledCount" INTEGER NOT NULL DEFAULT 0,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "grossRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageOrderValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_daily_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_daily_reports" (
    "id" UUID NOT NULL,
    "date" TEXT NOT NULL,
    "productId" UUID NOT NULL,
    "soldQty" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_daily_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneNumber_key" ON "users"("phoneNumber");

-- CreateIndex
CREATE INDEX "addresses_userId_idx" ON "addresses"("userId");

-- CreateIndex
CREATE INDEX "categories_parentId_idx" ON "categories"("parentId");

-- CreateIndex
CREATE INDEX "products_normalizedName_idx" ON "products"("normalizedName");

-- CreateIndex
CREATE INDEX "option_values_productId_idx" ON "option_values"("productId");

-- CreateIndex
CREATE INDEX "product_categories_categoryId_idx" ON "product_categories"("categoryId");

-- CreateIndex
CREATE INDEX "product_tags_tagId_idx" ON "product_tags"("tagId");

-- CreateIndex
CREATE INDEX "purchase_orders_userId_idx" ON "purchase_orders"("userId");

-- CreateIndex
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");

-- CreateIndex
CREATE INDEX "purchase_orders_createdAt_idx" ON "purchase_orders"("createdAt");

-- CreateIndex
CREATE INDEX "purchase_items_orderId_idx" ON "purchase_items"("orderId");

-- CreateIndex
CREATE INDEX "purchase_items_productId_idx" ON "purchase_items"("productId");

-- CreateIndex
CREATE INDEX "feedback_products_purchaseOrderId_isActive_createdAt_idx" ON "feedback_products"("purchaseOrderId", "isActive", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_products_userId_purchaseOrderId_key" ON "feedback_products"("userId", "purchaseOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "contact_spam_blocks_kind_value_key" ON "contact_spam_blocks"("kind", "value");

-- CreateIndex
CREATE UNIQUE INDEX "order_daily_reports_date_key" ON "order_daily_reports"("date");

-- CreateIndex
CREATE INDEX "product_daily_reports_date_idx" ON "product_daily_reports"("date");

-- CreateIndex
CREATE INDEX "product_daily_reports_productId_idx" ON "product_daily_reports"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_daily_reports_date_productId_key" ON "product_daily_reports"("date", "productId");

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option_values" ADD CONSTRAINT "option_values_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_productOptionValueId_fkey" FOREIGN KEY ("productOptionValueId") REFERENCES "option_values"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_products" ADD CONSTRAINT "feedback_products_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_products" ADD CONSTRAINT "feedback_products_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_products" ADD CONSTRAINT "feedback_products_repliedBy_fkey" FOREIGN KEY ("repliedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
