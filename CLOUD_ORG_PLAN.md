# 🗂️ KẾ HOẠCH PHÂN VÙNG GOOGLE CLOUD — 3 DỰ ÁN (doreto / decor / crm)

Mục tiêu: sắp xếp 3 dự án trên Google Cloud sao cho **không xung đột, không mất dữ liệu, không chồng chéo**, đồng thời **tối ưu chi phí vận hành**.

> Tài liệu này bao quát cả 3 dự án nhưng để trong repo doreto vì doreto là dự án mới cần deploy — sẽ được đặt vào đúng chỗ ngay từ đầu theo kế hoạch này.

---

## 1. Hiện trạng (khảo sát 2026-08)

Cả 3 dự án đang nằm chung **một** GCP project `project-ca44e667-92ed-44a7-b3d`, region `asia-southeast1`.

| Tài nguyên | CRM | Decor | Doreto |
|---|---|---|---|
| Cloud Run | `crm-backend-service` | `decorweb-be`, `decorweb-fe`, `decorweb-pl` (Mongo cũ) | *chưa có* |
| Cloud SQL | instance `crm-pl-prod` → db `crm_db` | instance `crm-pl-prod` → db `decor_web` | *chưa có* |
| Docker image | repo `crm-docker-repo` | repo `cloud-run-source-deploy` (mặc định) | *chưa có* |
| Lưu ảnh/video | bucket GCS `crm-pl-uploads` | Cloudinary (ảnh) + R2 bucket `decor-web` (video) | **R2 bucket riêng `doreto-web`** (cả ảnh + video) |
| Service Account | **chung** SA mặc định `4709805736-compute` | **chung** SA mặc định | — |

**Rủi ro chồng chéo đang tồn tại:**
1. Cả 3 chạy chung **một service account mặc định** → không có ranh giới quyền, một dự án về lý thuyết chạm được tài nguyên dự án khác.
2. Decor & CRM chung **một Cloud SQL instance và chung user `postgres`** → đổi mật khẩu/lỡ tay ở một bên ảnh hưởng bên kia (data thì tách theo database nên không mất).
3. Tên không nhất quán (`decorweb-*` vs `crm-backend-service`; instance tên `crm-pl-prod` nhưng chứa cả decor).
4. Decor để image ở repo mặc định `cloud-run-source-deploy` — mọi lệnh `deploy --source` đều đổ vào đây, dễ lẫn.
5. Còn `decorweb-pl` (bản Mongo cũ) chạy song song — nợ kỹ thuật cần dọn.

---

## 2. Hiểu đúng chi phí GCP (nền tảng để chọn phương án)

Điều quyết định chi phí không phải "chung hay riêng project", mà là **từng loại tài nguyên tính tiền theo gì**:

| Tài nguyên | Tính tiền theo | Ảnh hưởng cách phân vùng |
|---|---|---|
| **Cloud SQL** | Theo **instance chạy 24/7** (vCPU + RAM + disk), **KHÔNG theo số database** | ⚠️ **Khoản đắt nhất.** 1 instance chứa nhiều database gần như cùng giá. Tách mỗi dự án 1 instance = **nhân 2–3 lần tiền**. |
| **Cloud Run** | Theo request + CPU-time **thực dùng**, scale về 0 khi rảnh | Chung/riêng project **không đổi giá** — chạy bao nhiêu trả bấy nhiêu. |
| **Artifact Registry** | Theo GB image lưu trữ | Nhỏ, không đáng kể. |
| **Cloud Storage** | Theo GB lưu + băng thông | Nhỏ nếu chỉ vài ảnh; doreto/decor dùng Cloudinary nên gần như $0. |
| **Tạo thêm GCP project** | **MIỄN PHÍ** | Số project không tính tiền — chỉ tài nguyên bên trong mới tính. |

👉 **Kết luận cốt lõi:** giữ **chung một Cloud SQL instance** là đòn bẩy tiết kiệm lớn nhất (đây chính là lý do decor + crm đang chung `crm-pl-prod`). Mọi phương án tối ưu chi phí đều phải giữ điểm này.

---

## 3. So sánh 3 phương án

### Phương án A — Mỗi dự án một GCP project riêng, instance SQL riêng
- **Cô lập:** ⭐⭐⭐ cứng nhất, không thể xóa nhầm chéo, IAM/billing tách bạch.
- **Chi phí:** ❌ cao nhất — 3 Cloud SQL instance thay vì 1 (đắt gấp ~2–3 lần riêng khoản DB).
- **Công sức:** ❌ nặng — phải di chuyển decor + crm đang chạy, có downtime, cấu hình lại IAM/CI.
- **Hợp khi:** nhiều team khác nhau, cần hóa đơn tách riêng cho từng khách, yêu cầu tuân thủ (compliance).

### Phương án B — Chung project, chung 1 instance SQL, phân vùng bằng quy ước ✅ **(khuyến nghị)**
- **Cô lập:** ⭐⭐ đủ chặt — mỗi dự án có **service account riêng**, **database + user Postgres riêng**, tiền tố tên + label riêng. Ranh giới quyền thật sự, nhưng vẫn trong 1 project.
- **Chi phí:** ✅ thấp nhất — 1 Cloud SQL instance dùng chung, Cloud Run scale-to-zero.
- **Công sức:** ✅ nhẹ — không di chuyển decor/crm, không downtime. Chỉ thêm mới cho doreto + đổi tên/tách quyền dần.
- **Hợp khi:** một người/nhóm nhỏ quản cả 3 dự án nhỏ–vừa (đúng tình huống hiện tại).

### Phương án C — Chung project, chung instance, mỗi project 1 instance riêng chỉ khi cần
- Như B nhưng **tách instance SQL riêng cho dự án nào thật sự cần** (ví dụ CRM tải nặng) — số ít, khi có nhu cầu thực.
- Chi phí trung bình, linh hoạt. Đây là hướng nâng cấp tự nhiên của B khi một dự án lớn lên.

| Tiêu chí | A (project riêng) | **B (chung + quy ước)** | C (lai) |
|---|---|---|---|
| Chi phí DB | Cao (×2–3) | **Thấp (×1)** | Trung bình |
| Cô lập | Rất cao | **Vừa–cao** | Cao dần |
| Công sức triển khai | Nặng, có downtime | **Nhẹ, không downtime** | Nhẹ→vừa |
| Nguy cơ xóa nhầm chéo | Gần như 0 | Thấp (nhờ SA + user riêng) | Thấp |

---

## 4. 🏆 Khuyến nghị: Phương án B

**Lý do:** với 3 dự án nhỏ do cùng một người quản lý, chi phí lớn nhất là Cloud SQL instance chạy 24/7. Phương án B giữ **một instance chung** (rẻ nhất) nhưng vẫn dựng được ranh giới an toàn thật sự bằng **service account riêng + database/user Postgres riêng + quy ước tên**. Phương án A đắt gấp nhiều lần chỉ để đổi lấy mức cô lập mà dự án ở quy mô này chưa cần. Khi một dự án lớn lên (ví dụ CRM), nâng lên phương án C bằng cách tách riêng đúng instance đó — không phải làm lại từ đầu.

---

## 5. Quy ước phân vùng (áp cho cả 3 dự án)

### 5.1 Tiền tố tên nhất quán
Mọi tài nguyên đặt tên `<dựán>-<vaitrò>`:

| Dự án | Backend | Frontend | Database | Postgres user | Service Account |
|---|---|---|---|---|---|
| doreto | `doreto-be` | `doreto-fe` | `doreto_web` | `doreto_app` | `doreto-run@…` |
| decor | `decor-be` *(nay `decorweb-be`)* | `decor-fe` *(nay `decorweb-fe`)* | `decor_web` ✅ | `decor_app` | `decor-run@…` |
| crm | `crm-be` *(nay `crm-backend-service`)* | `crm-fe` | `crm_db` ✅ | `crm_app` | `crm-run@…` |

> Đổi tên **service Cloud Run không sửa được tại chỗ** (tạo mới = URL mới). Nên chỉ áp tên chuẩn cho **cái tạo mới** (doreto); decor/crm giữ tên cũ, ghi chú ở mục 7 để đổi khi có dịp redeploy lớn.

### 5.2 Cô lập database (quan trọng nhất để chống mất/chồng chéo dữ liệu)
- Giữ **một** Cloud SQL instance `crm-pl-prod` cho cả 3 (tối ưu chi phí).
- **Mỗi dự án một database riêng** — đã đúng: `crm_db`, `decor_web`; thêm `doreto_web`.
- **Mỗi dự án một Postgres user riêng, chỉ có quyền trên database của mình** (thay vì tất cả dùng chung `postgres`). Đây là hàng rào chính khiến một dự án không thể chạm data dự án khác dù chung instance:
  ```sql
  -- chạy một lần cho doreto (tương tự cho decor_app, crm_app)
  CREATE USER doreto_app WITH PASSWORD '<mật_khẩu_riêng>';
  GRANT ALL PRIVILEGES ON DATABASE doreto_web TO doreto_app;
  ```
- User `postgres` (superuser) chỉ dùng cho quản trị, **không** nhét vào biến môi trường của app.

### 5.3 Cô lập quyền (service account riêng)
- Mỗi dự án một service account riêng, gán vào các service Cloud Run của nó, chỉ cấp đúng quyền cần (Cloud SQL Client, đọc secret của riêng nó). Không dùng SA mặc định `4709805736-compute` chung nữa.

### 5.4 Cô lập image
- Mỗi dự án một Artifact Registry repo riêng: `doreto-docker`, `decor-docker`, `crm-docker-repo` (crm đã có).
- Tránh dồn hết vào repo mặc định `cloud-run-source-deploy`.

### 5.5 Label để lọc chi phí & tra cứu
- Gắn label `app=doreto|decor|crm` cho mọi tài nguyên (Cloud Run, Cloud SQL database khó gắn nhưng service/instance thì được) → xem báo cáo chi phí tách theo dự án trong Billing.

---

## 6. Kế hoạch tài nguyên cho DORETO (áp ngay quy ước trên)

| Hạng mục | Giá trị |
|---|---|
| Database | `doreto_web` trong instance `crm-pl-prod` |
| Postgres user | `doreto_app` (quyền chỉ trên `doreto_web`) |
| Backend Cloud Run | `doreto-be` (nối `crm-pl-prod` qua socket) |
| Frontend Cloud Run | `doreto-fe` |
| Image repo | `doreto-docker` (Artifact Registry, asia-southeast1) |
| Service account | `doreto-run@project-ca44e667-92ed-44a7-b3d.iam.gserviceaccount.com` |
| Lưu ảnh + video | Cloudflare R2 **bucket riêng `doreto-web`** (folder `doreto`), CDN riêng — tách hẳn `decor-web` |
| Label | `app=doreto` |

Các bước deploy chi tiết (lệnh cụ thể) xem **DEPLOYMENT_GUIDE.md**. Điểm khác so với guide hiện tại: dùng user `doreto_app` thay vì `postgres` trong `DATABASE_URL`, và gán service account + repo riêng.

---

## 7. Nợ kỹ thuật nên dọn dần (không gấp, không downtime nếu làm đúng)

1. **Xóa `decorweb-pl`** (bản Decor Mongo cũ) sau khi chắc chắn bản Postgres `decorweb-be` đã thay thế hoàn toàn — giảm rác + chi phí.
2. **Tách user Postgres**: tạo `decor_app`, `crm_app`, đổi `DATABASE_URL` của decor/crm sang user riêng, rồi thu hồi bớt quyền của `postgres` trong app.
3. **Gán service account riêng** cho decorweb-* và crm-backend-service (hiện đang chạy SA mặc định).
4. (Tùy chọn) Khi redeploy lớn, đổi tên `decorweb-*` → `decor-*` cho nhất quán.
5. **Ghi chú instance khó hiểu**: `crm-pl-prod` thực chất chứa cả 3 dự án — cân nhắc coi đây là "instance dùng chung" và đặt label/ghi tài liệu, hoặc đổi tên khi tạo instance thay thế trong tương lai. (Instance `crm-pl` hiện tài khoản không có quyền truy cập — đừng dùng.)

---

## 8. Checklist thực thi cho doreto (thứ tự)

- [ ] Tạo database: `gcloud sql databases create doreto_web --instance=crm-pl-prod`
- [ ] Tạo Postgres user `doreto_app` + cấp quyền trên `doreto_web`
- [ ] Tạo Artifact repo: `gcloud artifacts repositories create doreto-docker --repository-format=docker --location=asia-southeast1`
- [ ] Tạo service account `doreto-run` + gán role `roles/cloudsql.client`
- [ ] Migrate + seed vào `doreto_web` (qua Cloud SQL Auth Proxy)
- [ ] Deploy `doreto-be` (service account riêng, `--add-cloudsql-instances crm-pl-prod`, `DATABASE_URL` dùng `doreto_app`)
- [ ] Deploy `doreto-fe` (trỏ URL `doreto-be`)
- [ ] Gắn label `app=doreto` cho cả 2 service

---

*Cập nhật lần cuối: 2026-08. Chi tiết hạ tầng & cách chạy gcloud xem ghi nhớ dự án.*
