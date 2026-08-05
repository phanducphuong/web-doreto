-- CreateTable
CREATE TABLE "product_similars" (
    "productId" UUID NOT NULL,
    "similarProductId" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_similars_pkey" PRIMARY KEY ("productId","similarProductId")
);

-- CreateIndex
CREATE INDEX "product_similars_similarProductId_idx" ON "product_similars"("similarProductId");

-- AddForeignKey
ALTER TABLE "product_similars" ADD CONSTRAINT "product_similars_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_similars" ADD CONSTRAINT "product_similars_similarProductId_fkey" FOREIGN KEY ("similarProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
