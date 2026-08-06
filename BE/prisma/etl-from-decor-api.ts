/**
 * ETL một lần: kéo dữ liệu SẢN PHẨM từ web decor cũ (API production, CHỈ ĐỌC)
 * vào PostgreSQL của dự án này (id cũ dạng số/ObjectId → UUID mới).
 *
 * Kéo: categories, tags, products (kèm biến thể optionValues).
 * KHÔNG kéo: users, đơn hàng, feedback (không đọc được qua API công khai).
 *
 * Chạy:  npx ts-node --transpile-only prisma/etl-from-decor-api.ts
 * Idempotent: xóa sạch products/categories/tags trong Postgres rồi nạp lại.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SOURCE_API = process.env.DECOR_SOURCE_API || 'https://be-nemp-production.up.railway.app';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${SOURCE_API}${path}`);
  if (!res.ok) {
    throw new Error(`GET ${path} -> HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

type OldCategory = {
  _id: number;
  name: string;
  slug: string;
  parentId?: number | null;
  order?: number;
  icon?: string | null;
  description?: string;
  createdAt?: string;
};

type OldTag = {
  _id: number;
  name: string;
  icon?: string | null;
  order?: number;
  isActive?: boolean;
};

type OldOptionValue = {
  _id: string;
  imageUrl?: string;
  price: number;
  originalPrice?: number;
  purchaseCount?: number;
  stock?: number;
  productOptionNames?: string[];
  createdAt?: string;
};

type OldProduct = {
  _id: number;
  name: string;
  description?: string;
  normalizedName?: string;
  minPrice?: number;
  maxPrice?: number;
  purchaseCount?: number;
  averageRating?: number;
  ratingCount?: number;
  isActive?: boolean;
  stock?: number;
  productOptions?: string[];
  imageUrls?: string[];
  thumbnailUrls?: string[];
  categoryIds?: (number | string)[];
  tagIds?: (number | string)[];
  optionValues?: OldOptionValue[];
  createdAt?: string;
};

async function main() {
  console.log(`Nguồn: ${SOURCE_API}`);

  // ===== 0. Dọn dữ liệu catalog cũ trong Postgres (idempotent) =====
  await prisma.purchaseItem.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.productTag.deleteMany();
  await prisma.optionValue.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();
  console.log('✓ Đã dọn bảng catalog trong Postgres');

  // ===== 1. Categories (2 lượt: tạo trước, gắn cha sau) =====
  const oldCategories = await fetchJson<OldCategory[]>('/categories');
  const categoryIdMap = new Map<string, string>(); // id cũ (string hóa) -> uuid mới

  for (const c of oldCategories) {
    const created = await prisma.category.create({
      data: {
        name: c.name?.trim() ?? '',
        slug: c.slug ?? '',
        order: c.order ?? 0,
        icon: c.icon ?? undefined,
        description: c.description ?? '',
        ...(c.createdAt ? { createdAt: new Date(c.createdAt) } : {}),
      },
    });
    categoryIdMap.set(String(c._id), created.id);
  }
  // Gắn parentId theo bảng ánh xạ
  for (const c of oldCategories) {
    if (c.parentId === null || c.parentId === undefined) continue;
    const newId = categoryIdMap.get(String(c._id));
    const newParentId = categoryIdMap.get(String(c.parentId));
    if (newId && newParentId) {
      await prisma.category.update({
        where: { id: newId },
        data: { parentId: newParentId },
      });
    }
  }
  console.log(`✓ Categories: ${oldCategories.length}`);

  // ===== 2. Tags =====
  const oldTags = await fetchJson<OldTag[]>('/tags');
  const tagIdMap = new Map<string, string>();
  for (const t of oldTags) {
    const created = await prisma.tag.create({
      data: {
        name: t.name?.trim() ?? '',
        icon: t.icon ?? undefined,
        order: t.order ?? 0,
        isActive: t.isActive ?? true,
      },
    });
    tagIdMap.set(String(t._id), created.id);
  }
  console.log(`✓ Tags: ${oldTags.length}`);

  // ===== 3. Products (phân trang) + biến thể =====
  const limit = 50;
  let page = 1;
  let fetched = 0;
  let total = Infinity;
  let productCount = 0;
  let optionCount = 0;
  let missingCategoryRefs = 0;

  while (fetched < total) {
    const res = await fetchJson<{ data: OldProduct[]; total: number }>(
      `/products?page=${page}&limit=${limit}`,
    );
    total = res.total;
    fetched += res.data.length;
    page += 1;
    if (!res.data.length) break;

    for (const p of res.data) {
      const options = (p.optionValues ?? []).map((o) => ({
        imageUrl: o.imageUrl,
        price: o.price ?? 0,
        originalPrice: o.originalPrice,
        purchaseCount: o.purchaseCount ?? 0,
        stock: o.stock ?? 0,
        productOptionNames: o.productOptionNames ?? [],
        ...(o.createdAt ? { createdAt: new Date(o.createdAt) } : {}),
      }));

      // Ánh xạ danh mục/nhãn (id cũ có thể là số hoặc chuỗi — chuẩn hóa qua String())
      const catIds = [
        ...new Set(
          (p.categoryIds ?? [])
            .map((cid) => categoryIdMap.get(String(cid)))
            .filter((v): v is string => Boolean(v)),
        ),
      ];
      missingCategoryRefs +=
        (p.categoryIds ?? []).length - catIds.length > 0 ? 1 : 0;
      const tIds = [
        ...new Set(
          (p.tagIds ?? [])
            .map((tid) => tagIdMap.get(String(tid)))
            .filter((v): v is string => Boolean(v)),
        ),
      ];

      await prisma.product.create({
        data: {
          name: p.name?.trim() ?? '',
          description: p.description ?? undefined,
          normalizedName: p.normalizedName ?? '',
          minPrice: p.minPrice ?? 0,
          maxPrice: p.maxPrice ?? 0,
          purchaseCount: p.purchaseCount ?? 0,
          averageRating: p.averageRating ?? 0,
          ratingCount: p.ratingCount ?? 0,
          isActive: p.isActive ?? true,
          stock: p.stock ?? 0,
          productOptions: p.productOptions ?? [],
          imageUrls: p.imageUrls ?? [],
          thumbnailUrls: p.thumbnailUrls ?? [],
          ...(p.createdAt ? { createdAt: new Date(p.createdAt) } : {}),
          categories: catIds.length
            ? { create: catIds.map((categoryId) => ({ categoryId })) }
            : undefined,
          tags: tIds.length
            ? { create: tIds.map((tagId) => ({ tagId })) }
            : undefined,
          optionValues: options.length ? { create: options } : undefined,
        },
      });
      productCount += 1;
      optionCount += options.length;
    }
    console.log(`  ... đã nạp ${fetched}/${total} sản phẩm`);
  }

  console.log(`✓ Products: ${productCount} (biến thể: ${optionCount})`);
  if (missingCategoryRefs) {
    console.log(
      `⚠ ${missingCategoryRefs} sản phẩm có tham chiếu danh mục không còn tồn tại (đã bỏ qua tham chiếu hỏng)`,
    );
  }

  // ===== 4. Đối chiếu =====
  const [pgProducts, pgCategories, pgTags, pgOptions] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.tag.count(),
    prisma.optionValue.count(),
  ]);
  console.log('===== ĐỐI CHIẾU =====');
  console.log(`Postgres: ${pgProducts} products / ${pgCategories} categories / ${pgTags} tags / ${pgOptions} option values`);
  console.log(`Nguồn:    ${total} products / ${oldCategories.length} categories / ${oldTags.length} tags`);
  if (pgProducts !== total || pgCategories !== oldCategories.length) {
    throw new Error('SỐ LƯỢNG KHÔNG KHỚP — kiểm tra lại!');
  }
  console.log('🎉 ETL hoàn tất, số lượng khớp nguồn.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
