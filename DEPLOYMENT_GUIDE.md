# 🚀 HƯỚNG DẪN TRIỂN KHAI DỰ ÁN DECOR WEB LÊN GOOGLE CLOUD (GCP) TỪ MÁY LOCAL

Tài liệu này hướng dẫn chi tiết từng bước kết nối máy tính local của bạn với Google Cloud Platform thông qua **`gcloud CLI`** để tự động đóng gói (build) và triển khai (deploy) ứng dụng **Backend (`NestJS`)** và **Frontend (`Nuxt 3`)** lên **Google Cloud Run**.

---

## 📋 I. CHUẨN BỊ BAN ĐẦU (PREREQUISITES)

### 1. Cài đặt Google Cloud SDK (`gcloud CLI`)
- **Windows**: Tải và chạy bộ cài đặt [Google Cloud SDK Installer](https://cloud.google.com/sdk/docs/install#windows).
- **macOS**: Chạy lệnh `brew install --cask google-cloud-sdk`
- **Linux (Ubuntu/Debian)**:
  ```bash
  sudo apt-get update && sudo apt-get install -y google-cloud-cli
  ```

---

## 🔑 II. XÁC THỰC VÀ KẾT NỐI VỚI GOOGLE CLOUD (AUTHENTICATION)

Mở Terminal / Command Prompt tại máy local của bạn và thực hiện 2 lệnh sau:

### 1. Đăng nhập tài khoản Google Cloud
```bash
gcloud auth login
```
> Trình duyệt web sẽ tự động mở ra -> Chọn tài khoản Google sở hữu dự án GCP (`tmi.anvv@gmail.com`).

### 2. Thiết lập GCP Project mặc định
```bash
gcloud config set project project-ca44e667-92ed-44a7-b3d
```

### 3. Đăng nhập Docker Registry của Google (nếu cần build image)
```bash
gcloud auth configure-docker asia-southeast1-docker.pkg.dev
```

---

## ⚙️ III. TRIỂN KHAI BACKEND (`BE` - NestJS)

Mở terminal tại thư mục gốc của dự án (`decorweb-pl`) và chạy lệnh bên dưới:

```bash
gcloud run deploy decorweb-be \
  --source ./BE \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars "MONGO_URI=mongodb://admin:decorweb_secret_123@34.28.127.106:27017/decorweb_db?authSource=admin,JWT_SECRET=decorweb-pl-12345"
```

### 💡 Giải thích tham số:
* `--source ./BE`: Chỉ định thư mục chứa nguồn code Backend.
* `--region asia-southeast1`: Đặt máy chủ tại Singapore (cho tốc độ phản hồi siêu nhanh ở Việt Nam).
* `--allow-unauthenticated`: Mở quyền truy cập công khai cho API.
* `--set-env-vars`: Thiết lập biến môi trường kết nối Database MongoDB & JWT Secret Key.

> Sau khi chạy xong, Terminal sẽ trả về **URL Backend** dạng:
> 👉 `https://decorweb-be-4709805736.asia-southeast1.run.app`

---

## 🎨 IV. TRIỂN KHAI FRONTEND (`FE` - Nuxt 3)

Chạy câu lệnh dưới đây để deploy trang web Frontend:

```bash
gcloud run deploy decorweb-fe \
  --source ./FE \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars "NUXT_PUBLIC_API_BASE_URL=https://decorweb-be-4709805736.asia-southeast1.run.app"
```

> **Lưu ý**: Giá trị của `NUXT_PUBLIC_API_BASE_URL` chính là URL của Backend vừa lấy ở **Bước III**.

---

## 🗄️ V. QUẢN LÝ MÁY CHỦ DATABASE (`MONGODB` VM)

### 1. Kết nối SSH vào máy chủ MongoDB từ máy local
```bash
gcloud compute ssh decorweb-pl-db --zone=us-central1-a
```

### 2. Khởi chạy lại Container MongoDB (nếu cần)
```bash
sudo docker run -d \
  --name mongodb \
  --restart always \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=decorweb_secret_123 \
  -v mongo_data:/data/db \
  mongo:latest
```

### 3. Kiểm tra Luật Tường Lửa (Firewall Rule) mở cổng 27017
```bash
gcloud compute firewall-rules create allow-mongodb-27017 \
  --allow=tcp:27017 \
  --source-ranges=0.0.0.0/0 \
  --direction=INGRESS
```

---

## ⚡ VI. MẸO CẬP NHẬT CODE NHANH CHỈ VỚI 1 CÂU LỆNH

Khi bạn tiến hành chỉnh sửa code thêm tính năng mới ở máy local và muốn đẩy lên Google Cloud Run ngay lập tức:

* **Cập nhật Backend (`BE`)**:
  ```bash
  gcloud run deploy decorweb-be --source ./BE --region asia-southeast1
  ```

* **Cập nhật Frontend (`FE`)**:
  ```bash
  gcloud run deploy decorweb-fe --source ./FE --region asia-southeast1
  ```
