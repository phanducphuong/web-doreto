# Doreto Backend (NestJS + PostgreSQL + Prisma)

Backend cho web bán thời trang Doreto. Đã chuyển từ MongoDB sang **PostgreSQL** dùng **Prisma**.

## Yêu cầu
- Node 18+ và pnpm
- Docker (để chạy PostgreSQL ở máy dev) — hoặc một PostgreSQL sẵn có

## Cài đặt & chạy local

```bash
# 1. Bật PostgreSQL bằng Docker (chạy ở thư mục gốc dự án, nơi có docker-compose.yml)
docker compose up -d

# 2. Cài thư viện
pnpm install

# 3. Tạo file .env từ mẫu rồi điền giá trị
cp .env.example .env
# QUAN TRỌNG: đảm bảo có dòng DATABASE_URL trỏ tới Postgres local:
# DATABASE_URL="postgresql://doreto:doreto_secret@localhost:5432/doreto_web?schema=public"

# 4. Tạo bảng trong database theo schema
pnpm prisma migrate dev

# 5. Nạp dữ liệu mẫu (admin + danh mục + sản phẩm thời trang)
pnpm seed

# 6. Chạy backend (cổng 8081)
pnpm dev
```

Tài khoản admin sau khi seed: **admin@doreto.com**. Mật khẩu ở local mặc định `admin123` (chỉ khi không đặt env `SEED_ADMIN_PASSWORD`); production phải đặt `SEED_ADMIN_PASSWORD`.

## Các lệnh Prisma hữu ích
- `pnpm prisma:studio` — mở giao diện xem/sửa dữ liệu trực quan
- `pnpm prisma migrate dev --name <tên>` — tạo migration khi đổi `prisma/schema.prisma`
- `pnpm prisma generate` — sinh lại Prisma Client

## Kiến trúc dữ liệu
- Schema Prisma: `prisma/schema.prisma` (khóa chính UUID cho mọi bảng)
- API vẫn trả trường `_id` (map từ `id`) để tương thích frontend — xem `src/common/interceptors/id-serialize.interceptor.ts`
- Kết nối DB: `src/prisma/prisma.service.ts`

## Triển khai lên Google Cloud (Cloud SQL for PostgreSQL)
1. Tạo instance Cloud SQL (PostgreSQL) và một database riêng cho Doreto.
2. Đặt biến môi trường `DATABASE_URL` trỏ tới Cloud SQL (không dùng docker-compose ở production).
3. Chạy migration khi deploy: `pnpm prisma migrate deploy` (chỉ áp dụng migration đã có, không tạo mới).
4. (Tùy chọn) chạy `pnpm seed` một lần cho môi trường mới.

> Mỗi dự án nên có **database riêng**. Có thể dùng chung một Cloud SQL instance nhưng tách database cho từng dự án; đồng bộ dữ liệu giữa các dự án qua API, không cho đọc thẳng bảng của nhau.
