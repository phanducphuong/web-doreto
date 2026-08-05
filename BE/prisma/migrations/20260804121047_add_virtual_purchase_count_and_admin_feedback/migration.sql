-- AlterTable
ALTER TABLE "feedback_products" ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "isAdminCreated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "productId" UUID,
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "purchaseOrderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "virtualPurchaseCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "feedback_products_productId_isActive_createdAt_idx" ON "feedback_products"("productId", "isActive", "createdAt");

-- AddForeignKey
ALTER TABLE "feedback_products" ADD CONSTRAINT "feedback_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
