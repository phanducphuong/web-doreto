# 🚀 HƯỚNG DẪN TRIỂN KHAI DORETO LÊN GOOGLE CLOUD

Dự án gồm **Backend (NestJS + Prisma + PostgreSQL)** và **Frontend (Nuxt)**. Database dùng **Cloud SQL for PostgreSQL** (dịch vụ Postgres do Google quản lý). Backend/Frontend deploy lên **Cloud Run**.

---

## 📋 I. CHUẨN BỊ

Cài Google Cloud SDK (`gcloud CLI`):
- **macOS**: `brew install --cask google-cloud-sdk`
- **Windows**: tải [installer](https://cloud.google.com/sdk/docs/install#windows)
- **Linux**: `sudo apt-get update && sudo apt-get install -y google-cloud-cli`

Đăng nhập và chọn project:
```bash
gcloud auth login
gcloud config set project <PROJECT_ID>
```

---

## 🗄️ II. TẠO DATABASE (Cloud SQL for PostgreSQL)

> Có thể dùng chung **một** Cloud SQL instance cho nhiều dự án, nhưng mỗi dự án nên có **database riêng**. Ở đây tạo database `doreto_web`.

```bash
# Tạo instance (nếu chưa có). Chọn cấu hình nhỏ để tiết kiệm, nâng sau khi cần.
gcloud sql instances create doreto-db \
  --database-version=POSTGRES_16 \
  --tier=db-g1-small \
  --region=asia-southeast1 \
  --storage-size=10GB

# Đặt mật khẩu cho user postgres
gcloud sql users set-password postgres --instance=doreto-db --password=<DB_PASSWORD>

# Tạo database riêng cho Doreto
gcloud sql databases create doreto_web --instance=doreto-db
```

Lấy **connection name** của instance (dạng `project:region:doreto-db`):
```bash
gcloud sql instances describe doreto-db --format="value(connectionName)"
```

Chuỗi `DATABASE_URL` khi backend chạy trên Cloud Run (kết nối qua Cloud SQL socket):
```
postgresql://postgres:<DB_PASSWORD>@localhost/doreto_web?host=/cloudsql/<CONNECTION_NAME>
```

---

## ⚙️ III. TRIỂN KHAI BACKEND (NestJS)

```bash
gcloud run deploy doreto-be \
  --source ./BE \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --add-cloudsql-instances <CONNECTION_NAME> \
  --set-env-vars "DATABASE_URL=postgresql://postgres:<DB_PASSWORD>@localhost/doreto_web?host=/cloudsql/<CONNECTION_NAME>,JWT_SECRET=<đổi_chuỗi_bí_mật>,JWT_REFRESH_SECRET=<đổi_chuỗi_bí_mật>,PORT=8080"
```

Sau khi deploy xong, terminal trả về **URL Backend** dạng `https://doreto-be-xxxx.asia-southeast1.run.app`.

### Chạy migration + seed cho database production
Chạy migration một lần (áp dụng schema đã có, không tạo mới) — thực hiện từ máy local trỏ vào Cloud SQL qua **Cloud SQL Auth Proxy**, hoặc qua một job:
```bash
# Ở máy local: bật proxy tới instance, rồi:
DATABASE_URL="postgresql://postgres:<DB_PASSWORD>@localhost:5432/doreto_web?schema=public" \
  pnpm --dir BE prisma migrate deploy
# (Tùy chọn) nạp dữ liệu mẫu lần đầu:
DATABASE_URL="..." pnpm --dir BE seed
```

---

## 🎨 IV. TRIỂN KHAI FRONTEND (Nuxt)

```bash
gcloud run deploy doreto-fe \
  --source ./FE \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars "NUXT_PUBLIC_API_BASE_URL=https://doreto-be-xxxx.asia-southeast1.run.app"
```
> `NUXT_PUBLIC_API_BASE_URL` chính là URL Backend lấy ở Bước III.

---

## ⚡ V. CẬP NHẬT NHANH KHI SỬA CODE

```bash
# Backend
gcloud run deploy doreto-be --source ./BE --region asia-southeast1
# Frontend
gcloud run deploy doreto-fe --source ./FE --region asia-southeast1
```

Nếu có đổi `prisma/schema.prisma`: tạo migration ở local (`pnpm prisma migrate dev --name <tên>`), commit, rồi chạy `prisma migrate deploy` cho production trước khi deploy backend.

---

## 🖥️ Chạy ở máy local (tóm tắt)
```bash
docker compose up -d          # Postgres local
pnpm --dir BE install && cp BE/.env.example BE/.env   # điền DATABASE_URL
pnpm --dir BE prisma migrate dev && pnpm --dir BE seed
pnpm --dir BE dev             # backend cổng 8081
pnpm --dir FE install && cp FE/.env.example FE/.env   # NUXT_PUBLIC_API_BASE_URL=http://localhost:8081
pnpm --dir FE dev             # frontend
```
Admin mặc định sau seed: **admin@doreto.com / admin123**
