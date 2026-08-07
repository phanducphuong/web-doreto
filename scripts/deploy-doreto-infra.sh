#!/usr/bin/env bash
# Tạo nền tảng hạ tầng doreto trên Google Cloud (Phương án B).
# An toàn: chỉ THÊM MỚI tài nguyên doreto, không đụng decor/crm. Idempotent (chạy lại không hỏng).
# Sinh secret production và lưu ra scratchpad để bước deploy dùng lại.
set -uo pipefail

export CLOUDSDK_PYTHON="$HOME/.local/python-gcloud/bin/python3.12"
export PATH="$HOME/.local/google-cloud-sdk/bin:$PATH"

PROJECT="project-ca44e667-92ed-44a7-b3d"
REGION="asia-southeast1"
CONN="$PROJECT:$REGION:crm-pl-prod"
SA_EMAIL="doreto-run@$PROJECT.iam.gserviceaccount.com"
SECRETS_FILE="/private/tmp/claude-501/-Users-phanphuong02-Projects-web-doreto/1904bfef-4898-4045-bf31-fa76b8cf6343/scratchpad/doreto-secrets.env"

echo "== Account: $(gcloud config get-value account 2>/dev/null) | Project: $(gcloud config get-value project 2>/dev/null)"

# --- Secrets: sinh 1 lần rồi tái dùng nếu file đã tồn tại (để chạy lại không đổi mật khẩu) ---
if [ -f "$SECRETS_FILE" ]; then
  echo "== Đã có secrets file cũ, dùng lại (không sinh mới)."
  # shellcheck disable=SC1090
  source "$SECRETS_FILE"
else
  DB_PW=$(openssl rand -hex 16)
  JWT_SECRET=$(openssl rand -hex 32)
  JWT_REFRESH_SECRET=$(openssl rand -hex 32)
  DATABASE_URL="postgresql://doreto_app:${DB_PW}@localhost/doreto_web?host=/cloudsql/${CONN}&schema=public"
  {
    echo "# Secret production doreto — sinh $(date +%F). KHÔNG commit. Lưu nơi an toàn."
    echo "DB_PW=${DB_PW}"
    echo "JWT_SECRET=${JWT_SECRET}"
    echo "JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}"
    echo "DATABASE_URL=${DATABASE_URL}"
  } > "$SECRETS_FILE"
  echo "== Đã sinh secret & lưu vào $SECRETS_FILE"
fi

echo ""; echo "===== 1) Database doreto_web ====="
if gcloud sql databases describe doreto_web --instance=crm-pl-prod >/dev/null 2>&1; then
  echo "  đã tồn tại — bỏ qua."
else
  gcloud sql databases create doreto_web --instance=crm-pl-prod && echo "  ✅ tạo xong"
fi

echo ""; echo "===== 2) User doreto_app ====="
if gcloud sql users list --instance=crm-pl-prod --format="value(name)" | grep -qx "doreto_app"; then
  echo "  đã tồn tại — bỏ qua (mật khẩu giữ nguyên)."
else
  gcloud sql users create doreto_app --instance=crm-pl-prod --password="$DB_PW" && echo "  ✅ tạo xong"
fi

echo ""; echo "===== 3) Artifact repo doreto-docker ====="
if gcloud artifacts repositories describe doreto-docker --location="$REGION" >/dev/null 2>&1; then
  echo "  đã tồn tại — bỏ qua."
else
  gcloud artifacts repositories create doreto-docker --repository-format=docker --location="$REGION" --description="Docker images cho doreto" && echo "  ✅ tạo xong"
fi

echo ""; echo "===== 4) Service account doreto-run ====="
if gcloud iam service-accounts describe "$SA_EMAIL" >/dev/null 2>&1; then
  echo "  đã tồn tại — bỏ qua."
else
  gcloud iam service-accounts create doreto-run --display-name="Doreto Cloud Run" && echo "  ✅ tạo xong"
fi

echo ""; echo "===== 5) Gán role cloudsql.client cho doreto-run ====="
gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/cloudsql.client" --condition=None >/dev/null 2>&1 && echo "  ✅ đã gán (idempotent)"

echo ""; echo "===== KẾT QUẢ NỀN ====="
echo "DB databases:"; gcloud sql databases list --instance=crm-pl-prod --format="value(name)" | sed 's/^/  - /'
echo "Artifact repos:"; gcloud artifacts repositories list --location="$REGION" --format="value(name.basename())" | sed 's/^/  - /'
echo "Service account: $SA_EMAIL"
echo ""; echo "== XONG. Secrets ở: $SECRETS_FILE =="
