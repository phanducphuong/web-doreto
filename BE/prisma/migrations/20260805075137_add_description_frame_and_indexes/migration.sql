-- AlterTable
ALTER TABLE "products" ADD COLUMN     "descriptionFrameId" UUID;

-- CreateIndex
CREATE INDEX "products_isActive_purchaseCount_idx" ON "products"("isActive", "purchaseCount");

-- CreateIndex
CREATE INDEX "products_minPrice_idx" ON "products"("minPrice");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_descriptionFrameId_fkey" FOREIGN KEY ("descriptionFrameId") REFERENCES "image_frames"("id") ON DELETE SET NULL ON UPDATE CASCADE;
