import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { normalizeText } from '../src/common/utils';

const prisma = new PrismaClient();

const slugify = (s: string) => normalizeText(s).replace(/[^a-z0-9]+/g, '-');

async function seedAdmin() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@doreto.com' },
    update: {},
    create: {
      email: 'admin@doreto.com',
      name: 'Quản trị Doreto',
      password: adminPassword,
      role: 'admin',
      phoneNumber: '0900000000',
    },
  });
  console.log('✓ Tạo admin: admin@doreto.com / admin123');
  console.log('  (Đổi mật khẩu này ngay khi lên production!)');
}

async function seedCategories() {
  if ((await prisma.category.count()) > 0) {
    console.log('↷ Đã có danh mục, bỏ qua');
    return;
  }

  const tree: { name: string; children?: string[] }[] = [
    { name: 'Áo', children: ['Áo thun', 'Áo sơ mi', 'Áo khoác'] },
    { name: 'Quần', children: ['Quần jean', 'Quần âu', 'Quần short'] },
    { name: 'Váy & Đầm' },
    { name: 'Phụ kiện', children: ['Túi xách', 'Thắt lưng', 'Mũ nón'] },
  ];

  let order = 0;
  for (const node of tree) {
    const parent = await prisma.category.create({
      data: { name: node.name, slug: slugify(node.name), order: order++ },
    });
    let childOrder = 0;
    for (const childName of node.children ?? []) {
      await prisma.category.create({
        data: {
          name: childName,
          slug: slugify(childName),
          parentId: parent.id,
          order: childOrder++,
        },
      });
    }
  }
  console.log('✓ Tạo danh mục thời trang');
}

async function seedTags() {
  if ((await prisma.tag.count()) > 0) {
    console.log('↷ Đã có tag, bỏ qua');
    return;
  }
  await prisma.tag.createMany({
    data: [
      { name: 'Hàng mới', order: 0 },
      { name: 'Bán chạy', order: 1 },
      { name: 'Giảm giá', order: 2 },
    ],
  });
  console.log('✓ Tạo tag');
}

async function seedProducts() {
  if ((await prisma.product.count()) > 0) {
    console.log('↷ Đã có sản phẩm, bỏ qua');
    return;
  }

  const samples: {
    name: string;
    description: string;
    category: string;
    options: string[];
    variants: { names: string[]; price: number; originalPrice?: number; stock: number }[];
  }[] = [
    {
      name: 'Áo thun cotton basic',
      description: 'Áo thun 100% cotton, form regular, thấm hút mồ hôi tốt.',
      category: 'Áo thun',
      options: ['Màu sắc', 'Kích cỡ'],
      variants: [
        { names: ['Đen', 'M'], price: 159000, stock: 50 },
        { names: ['Đen', 'L'], price: 159000, stock: 40 },
        { names: ['Trắng', 'M'], price: 159000, stock: 35 },
        { names: ['Trắng', 'L'], price: 159000, stock: 30 },
      ],
    },
    {
      name: 'Áo sơ mi Oxford dài tay',
      description: 'Sơ mi Oxford dày dặn, đứng form, phù hợp đi làm và đi chơi.',
      category: 'Áo sơ mi',
      options: ['Màu sắc', 'Kích cỡ'],
      variants: [
        { names: ['Xanh nhạt', 'M'], price: 329000, originalPrice: 399000, stock: 25 },
        { names: ['Xanh nhạt', 'L'], price: 329000, originalPrice: 399000, stock: 20 },
        { names: ['Trắng', 'M'], price: 329000, originalPrice: 399000, stock: 22 },
      ],
    },
    {
      name: 'Quần jean slim-fit',
      description: 'Quần jean co giãn nhẹ, tôn dáng, bền màu sau nhiều lần giặt.',
      category: 'Quần jean',
      options: ['Màu sắc', 'Kích cỡ'],
      variants: [
        { names: ['Xanh đậm', '29'], price: 449000, stock: 18 },
        { names: ['Xanh đậm', '30'], price: 449000, stock: 20 },
        { names: ['Đen', '30'], price: 449000, stock: 15 },
      ],
    },
  ];

  for (const sample of samples) {
    const prices = sample.variants.map((v) => v.price);
    const category = await prisma.category.findFirst({ where: { name: sample.category } });

    const product = await prisma.product.create({
      data: {
        name: sample.name,
        description: sample.description,
        normalizedName: normalizeText(sample.name),
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        stock: sample.variants.reduce((sum, v) => sum + v.stock, 0),
        productOptions: sample.options,
        optionValues: {
          create: sample.variants.map((v) => ({
            productOptionNames: v.names,
            price: v.price,
            originalPrice: v.originalPrice,
            stock: v.stock,
          })),
        },
      },
    });

    if (category) {
      await prisma.productCategory.create({
        data: { productId: product.id, categoryId: category.id },
      });
    }
  }
  console.log('✓ Tạo sản phẩm thời trang mẫu');
}

async function main() {
  await seedAdmin();
  await seedCategories();
  await seedTags();
  await seedProducts();
}

main()
  .then(async () => {
    console.log('🌱 Seed hoàn tất');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
