/**
 * Khôi phục mã biến thể (optionValue.code) bị mất khi ETL từ hệ thống cũ.
 * Nguồn: API cũ (Railway) vẫn còn field `code`.
 * Khớp: sản phẩm theo normalizedName, biến thể theo tổ hợp productOptionNames.
 *
 * Chạy:  DRY_RUN=1 ... để chỉ đếm (không ghi). Bỏ DRY_RUN để ghi thật.
 *   pnpm --dir BE exec ts-node prisma/restore-option-codes.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SOURCE_API =
  process.env.DECOR_SOURCE_API || 'https://be-nemp-production.up.railway.app';
const DRY_RUN = process.env.DRY_RUN === '1';

type OldOV = { productOptionNames?: string[]; code?: string | null };
type OldProduct = {
  name: string;
  normalizedName?: string;
  optionValues?: OldOV[];
};

const norm = (s: string) =>
  (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

const comboKey = (names?: string[]) =>
  (names ?? []).map((n) => (n || '').trim()).join('|');

async function fetchAllOldProducts(): Promise<OldProduct[]> {
  const all: OldProduct[] = [];
  let page = 1;
  const limit = 100;
  for (;;) {
    const res = await fetch(`${SOURCE_API}/products?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error(`GET /products p${page} -> ${res.status}`);
    const body = (await res.json()) as { data: OldProduct[]; total: number };
    all.push(...body.data);
    if (page * limit >= body.total || body.data.length === 0) break;
    page++;
  }
  return all;
}

async function main() {
  console.log(`Nguồn cũ: ${SOURCE_API} | DRY_RUN=${DRY_RUN ? 'CÓ (không ghi)' : 'KHÔNG (ghi thật)'}`);
  const oldProducts = await fetchAllOldProducts();
  console.log(`Lấy ${oldProducts.length} sản phẩm từ nguồn cũ.`);

  // Map: normalizedName -> (comboKey -> code). Bỏ qua tên trùng để tránh nhầm.
  const nameCount = new Map<string, number>();
  for (const p of oldProducts) nameCount.set(norm(p.name), (nameCount.get(norm(p.name)) ?? 0) + 1);

  const codeMap = new Map<string, Map<string, string>>();
  for (const p of oldProducts) {
    const nkey = norm(p.name);
    if (nameCount.get(nkey)! > 1) continue; // tên trùng -> bỏ (không chắc chắn)
    const inner = new Map<string, string>();
    for (const o of p.optionValues ?? []) {
      const code = (o.code ?? '').toString().trim();
      if (code) inner.set(comboKey(o.productOptionNames), code);
    }
    if (inner.size) codeMap.set(nkey, inner);
  }

  const current = await prisma.product.findMany({
    include: { optionValues: true },
  });

  let matchedProducts = 0;
  let updated = 0;
  let alreadyHad = 0;
  let noSourceCode = 0;
  let ambiguousCombo = 0;

  for (const prod of current) {
    const inner = codeMap.get(norm(prod.name));
    if (!inner) continue;
    matchedProducts++;

    // phát hiện tổ hợp trùng trong SP hiện tại (không khớp chắc chắn được)
    const seen = new Set<string>();
    const dup = new Set<string>();
    for (const ov of prod.optionValues) {
      const k = comboKey(ov.productOptionNames);
      if (seen.has(k)) dup.add(k);
      seen.add(k);
    }

    for (const ov of prod.optionValues) {
      if (ov.code && ov.code.trim()) {
        alreadyHad++;
        continue;
      }
      const k = comboKey(ov.productOptionNames);
      if (dup.has(k)) {
        ambiguousCombo++;
        continue;
      }
      const code = inner.get(k);
      if (!code) {
        noSourceCode++;
        continue;
      }
      if (!DRY_RUN) {
        await prisma.optionValue.update({ where: { id: ov.id }, data: { code } });
      }
      updated++;
    }
  }

  console.log('--- KẾT QUẢ ---');
  console.log(`SP hiện tại khớp được với nguồn cũ: ${matchedProducts}`);
  console.log(`Biến thể ${DRY_RUN ? 'SẼ điền' : 'ĐÃ điền'} mã: ${updated}`);
  console.log(`Đã có code từ trước (bỏ qua): ${alreadyHad}`);
  console.log(`Không tìm thấy code ở nguồn cũ: ${noSourceCode}`);
  console.log(`Tổ hợp biến thể trùng (bỏ qua cho an toàn): ${ambiguousCombo}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
