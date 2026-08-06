import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Seed tối thiểu: chỉ tạo tài khoản admin.
// Dữ liệu sản phẩm/danh mục thật được kéo từ web decor cũ bằng script ETL:
//   npx ts-node --transpile-only prisma/etl-from-decor-api.ts
async function main() {
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
