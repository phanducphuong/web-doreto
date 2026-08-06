/**
 * Backfill slug cho các sản phẩm đã có (slug đang NULL) sau khi thêm cột slug.
 * Sinh slug từ tên theo đúng logic app (generateSlug), tự thêm hậu tố -2, -3...
 * khi trùng. Idempotent: chạy lại chỉ đụng SP còn thiếu slug.
 *
 * Chạy thử (chỉ in, không ghi):  DRY_RUN=1 pnpm --dir BE exec ts-node prisma/backfill-product-slug.ts
 * Chạy thật:                     pnpm --dir BE exec ts-node prisma/backfill-product-slug.ts
 */
import { PrismaClient } from '@prisma/client';
import { generateSlug } from '../src/common/utils';

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === '1';

async function main() {
  // Gom sẵn các slug đã tồn tại để tránh trùng ngay trong lúc backfill
  const taken = new Set<string>(
    (
      await prisma.product.findMany({
        where: { slug: { not: null } },
        select: { slug: true },
      })
    )
      .map((p) => p.slug)
      .filter((s): s is string => Boolean(s)),
  );

  const products = await prisma.product.findMany({
    where: { slug: null },
    select: { id: true, name: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(
    `${products.length} sản phẩm cần backfill slug${DRY_RUN ? ' (DRY_RUN)' : ''}`,
  );

  let updated = 0;
  for (const product of products) {
    const base = generateSlug(product.name) || 'san-pham';
    let slug = base;
    let counter = 2;
    while (taken.has(slug)) {
      slug = `${base}-${counter}`;
      counter += 1;
    }
    taken.add(slug);

    console.log(`  ${product.id}  ${JSON.stringify(product.name)} -> ${slug}`);
    if (!DRY_RUN) {
      await prisma.product.update({ where: { id: product.id }, data: { slug } });
    }
    updated += 1;
  }

  console.log(`✓ ${DRY_RUN ? 'Sẽ cập nhật' : 'Đã cập nhật'} ${updated} slug`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
