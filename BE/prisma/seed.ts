import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Seed tối thiểu: chỉ tạo tài khoản admin.
// Dữ liệu sản phẩm/danh mục thật được kéo từ web decor cũ bằng script ETL:
//   npx ts-node --transpile-only prisma/etl-from-decor-api.ts
async function main() {
  // Mật khẩu admin lấy từ env SEED_ADMIN_PASSWORD — KHÔNG hardcode để không lộ trong repo.
  // Ở production bắt buộc phải đặt env này (nếu không sẽ dừng, tránh tạo admin mật khẩu đoán được).
  const rawPassword = process.env.SEED_ADMIN_PASSWORD;
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd && !rawPassword) {
    throw new Error(
      'Thiếu SEED_ADMIN_PASSWORD — không seed admin ở production với mật khẩu mặc định. ' +
        'Đặt SEED_ADMIN_PASSWORD trước khi chạy seed.',
    );
  }

  // Dev/local: nếu không đặt env thì dùng mật khẩu tạm cho tiện (chỉ chạy khi KHÔNG phải production).
  const password = rawPassword || 'admin123';
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@doreto.com';
  const adminPassword = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Quản trị Doreto',
      password: adminPassword,
      role: 'admin',
      phoneNumber: '0900000000',
    },
  });
  console.log(`✓ Tạo admin: ${adminEmail}`);
  if (!rawPassword) {
    console.log('  (Đang dùng mật khẩu mặc định "admin123" — CHỈ dùng ở local. Đổi ngay nếu lỡ chạy nơi khác!)');
  }
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
