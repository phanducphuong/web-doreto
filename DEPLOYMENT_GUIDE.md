# 🚀 HƯỚNG DẪN TRIỂN KHAI DORETO LÊN GOOGLE CLOUD (Phương án B)

Dự án gồm **Backend (NestJS + Prisma + PostgreSQL)** và **Frontend (Nuxt)**.
- Database: **Cloud SQL for PostgreSQL** — dùng **chung instance `crm-pl-prod`** với decor/crm, nhưng **database + user Postgres riêng** cho doreto (tách vùng, không chồng chéo).
- Backend/Frontend: **Cloud Run**.
- Ảnh + video: **Cloudflare R2** — **bucket riêng `doreto-web`** (tách hẳn với decor).

> Chiến lược phân vùng tổng thể cho cả 3 dự án (doreto/decor/crm) xem `CLOUD_ORG_PLAN.md`.

---

## 📋 I. CHUẨN BỊ

gcloud đã cài sẵn trên máy. Mỗi phiên terminal cần nạp đúng Python (bản hệ thống 3.9 quá cũ):
```bash
export CLOUDSDK_PYTHON="$HOME/.local/python-gcloud/bin/python3.12"
export PATH="$HOME/.local/google-cloud-sdk/bin:$PATH"
```
Kiểm tra đã đăng nhập đúng account + project:
```bash
gcloud auth list          # phanducphuong94@gmail.com
gcloud config get-value project   # project-ca44e667-92ed-44a7-b3d
```

Đặt sẵn biến dùng lại:
```bash
PROJECT="project-ca44e667-92ed-44a7-b3d"
REGION="asia-southeast1"
CONN="$PROJECT:$REGION:crm-pl-prod"
```

---

## 🗄️ II. DATABASE (Cloud SQL — dùng chung instance, tách database + user)

```bash
# 1. Tạo database riêng cho doreto trong instance crm-pl-prod đang chạy (KHÔNG tạo instance mới)
gcloud sql databases create doreto_web --instance=crm-pl-prod

# 2. Tạo user Postgres RIÊNG cho doreto (không dùng chung user postgres với decor/crm)
gcloud sql users create doreto_app --instance=crm-pl-prod --password='<DB_PASSWORD_DORETO>'
```

Cấp quyền cho `doreto_app` chỉ trên database `doreto_web` (chạy 1 lần qua Cloud SQL Studio hoặc psql):
```sql
GRANT ALL PRIVILEGES ON DATABASE doreto_web TO doreto_app;
-- kết nối vào doreto_web rồi cấp quyền trên schema public:
GRANT ALL ON SCHEMA public TO doreto_app;
```

Chuỗi `DATABASE_URL` production (Cloud Run nối qua socket, `schema` nối bằng `&` vì đã có `?host=`):
```
postgresql://doreto_app:<DB_PASSWORD_DORETO>@localhost/doreto_web?host=/cloudsql/project-ca44e667-92ed-44a7-b3d:asia-southeast1:crm-pl-prod&schema=public
```

---

## 🖼️ III. LƯU TRỮ ẢNH + VIDEO (Cloudflare R2 — bucket riêng)

Làm trên **Cloudflare Dashboard > R2**:
1. Tạo bucket mới **`doreto-web`** (tách hẳn với bucket `decor-web` của decor).
2. Bật **Public access** và gắn **custom domain** (ví dụ `cdn.doreto.xxx`) → đây là `R2_PUBLIC_URL`.
3. Tạo **API Token** (R2) có quyền đọc/ghi bucket `doreto-web` → lấy `Access Key ID` + `Secret Access Key` + `Account ID`.

Các biến R2 backend cần (đặt ở bước IV):
```
R2_ACCOUNT_ID=...              # Account ID Cloudflare
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=doreto-web
R2_FOLDER=doreto
R2_PUBLIC_URL=https://cdn.doreto.xxx
```
> Code: ảnh upload qua `POST /uploads/files` và `/uploads/compress` (server đẩy thẳng lên R2); video qua `/uploads/videos/presign` + `/uploads/videos/complete` (browser upload thẳng lên R2 bằng presigned URL). Xem `BE/src/uploads/`.

---

## ⚙️ IV. TRIỂN KHAI BACKEND (NestJS)

Tạo tài nguyên riêng cho doreto (đúng phương án B — không dùng chung repo/SA mặc định):
```bash
# Artifact Registry repo riêng cho image doreto
gcloud artifacts repositories create doreto-docker \
  --repository-format=docker --location="$REGION" \
  --description="Docker images cho doreto"

# Service account riêng cho doreto
gcloud iam service-accounts create doreto-run --display-name="Doreto Cloud Run"
SA="doreto-run@$PROJECT.iam.gserviceaccount.com"
gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:$SA" --role="roles/cloudsql.client"
```

Deploy backend (dùng SA riêng, DATABASE_URL với user `doreto_app`, kèm biến R2 + Gemini):
```bash
gcloud run deploy doreto-be \
  --source ./BE \
  --region "$REGION" \
  --service-account "$SA" \
  --allow-unauthenticated \
  --add-cloudsql-instances "$CONN" \
  --set-env-vars "^@^DATABASE_URL=postgresql://doreto_app:<DB_PASSWORD_DORETO>@localhost/doreto_web?host=/cloudsql/$CONN&schema=public@JWT_SECRET=<bí_mật>@JWT_REFRESH_SECRET=<bí_mật>@JWT_EXPIRES=1h@JWT_REFRESH_EXPIRES=7d@PORT=8080@R2_ACCOUNT_ID=<...>@R2_ACCESS_KEY_ID=<...>@R2_SECRET_ACCESS_KEY=<...>@R2_BUCKET_NAME=doreto-web@R2_FOLDER=doreto@R2_PUBLIC_URL=https://cdn.doreto.xxx@GEMINI_API_KEY=<...>@GEMINI_MODEL=gemini-1.5-flash"
```
> Dùng dấu phân cách `^@^` vì `DATABASE_URL` chứa dấu phẩy. Deploy xong nhận **URL Backend** dạng `https://doreto-be-xxxx.asia-southeast1.run.app`.

### Migration + seed cho database production
Bật **Cloud SQL Auth Proxy** trỏ vào `crm-pl-prod` ở máy local, rồi:
```bash
DATABASE_URL="postgresql://doreto_app:<DB_PASSWORD_DORETO>@localhost:5432/doreto_web?schema=public" \
  pnpm --dir BE prisma migrate deploy
# (Tùy chọn) nạp dữ liệu mẫu lần đầu:
DATABASE_URL="postgresql://doreto_app:<DB_PASSWORD_DORETO>@localhost:5432/doreto_web?schema=public" \
  pnpm --dir BE seed
```

---

## 🎨 V. TRIỂN KHAI FRONTEND (Nuxt)

```bash
gcloud run deploy doreto-fe \
  --source ./FE \
  --region "$REGION" \
  --service-account "$SA" \
  --allow-unauthenticated \
  --set-env-vars "NUXT_PUBLIC_API_BASE_URL=https://doreto-be-xxxx.asia-southeast1.run.app"
```
> `NUXT_PUBLIC_API_BASE_URL` chính là URL Backend lấy ở Bước IV.

---

## ⚡ VI. CẬP NHẬT NHANH KHI SỬA CODE

```bash
gcloud run deploy doreto-be --source ./BE --region "$REGION"   # Backend
gcloud run deploy doreto-fe --source ./FE --region "$REGION"   # Frontend
```
Nếu đổi `prisma/schema.prisma`: tạo migration ở local (`pnpm prisma migrate dev --name <tên>`), commit, chạy `prisma migrate deploy` cho production trước khi deploy backend.

---

## ✅ Checklist phân vùng (đảm bảo không chồng chéo)

| Hạng mục | doreto | Tách khỏi decor/crm? |
|---|---|---|
| Database | `doreto_web` | ✅ riêng (chung instance `crm-pl-prod`) |
| Postgres user | `doreto_app` | ✅ riêng (không dùng chung `postgres`) |
| Cloud Run | `doreto-be`, `doreto-fe` | ✅ tên riêng |
| Service account | `doreto-run@…` | ✅ riêng (không dùng SA mặc định) |
| Image repo | `doreto-docker` | ✅ riêng |
| R2 bucket | `doreto-web` | ✅ riêng (khác `decor-web`) |

---

## 🖥️ Chạy ở máy local (tóm tắt)
```bash
docker compose up -d          # Postgres local (container doreto-fashion-postgres, cổng 5433)
pnpm --dir BE install && cp BE/.env.example BE/.env   # điền DATABASE_URL + R2 + JWT + Gemini
pnpm --dir BE prisma migrate dev && pnpm --dir BE seed
pnpm --dir BE dev             # backend cổng 8082
pnpm --dir FE install && cp FE/.env.example FE/.env   # NUXT_PUBLIC_API_BASE_URL=http://localhost:8082
pnpm --dir FE dev             # frontend
```
Admin mặc định sau seed: **admin@doreto.com / admin123**
