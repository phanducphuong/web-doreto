-- Thêm slug SEO cho sản phẩm.
-- Cột để NULL được để migrate an toàn trên dữ liệu cũ; backfill giá trị bằng
-- script prisma/backfill-product-slug.ts (khớp đúng logic sinh slug của app).
-- Unique index cho phép nhiều NULL trên Postgres, nên không vỡ khi còn SP chưa backfill.
ALTER TABLE "products" ADD COLUMN "slug" TEXT;

CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");
