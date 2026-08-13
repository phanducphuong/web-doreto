#!/usr/bin/env bash
# Build + deploy doreto-be lên Cloud Run (image vào repo doreto-docker, SA riêng, nối Cloud SQL).
# Migrate schema tự chạy khi container khởi động (xem BE/Dockerfile).
set -uo pipefail
export CLOUDSDK_PYTHON="$HOME/.local/python-gcloud/bin/python3.12"
export PATH="$HOME/.local/google-cloud-sdk/bin:$PATH"

PROJECT="project-ca44e667-92ed-44a7-b3d"
REGION="asia-southeast1"
CONN="$PROJECT:$REGION:crm-pl-prod"
SA="doreto-run@$PROJECT.iam.gserviceaccount.com"
SCRATCH="/private/tmp/claude-501/-Users-phanphuong02-Projects-web-doreto/1904bfef-4898-4045-bf31-fa76b8cf6343/scratchpad"
IMAGE="$REGION-docker.pkg.dev/$PROJECT/doreto-docker/doreto-be:latest"

if [ ! -f "$SCRATCH/doreto-secrets.env" ]; then
  echo "❌ Không thấy file secret $SCRATCH/doreto-secrets.env — chạy lại deploy-doreto-infra.sh trước."; exit 1
fi
# shellcheck disable=SC1090
source "$SCRATCH/doreto-secrets.env"

cd "/Users/phanphuong02/Projects/web doreto" || exit 1

echo "===== BUILD BE image → $IMAGE ====="
gcloud builds submit ./BE --tag "$IMAGE" || { echo "❌ BUILD BE THẤT BẠI"; exit 1; }

echo ""; echo "===== DEPLOY doreto-be ====="
gcloud run deploy doreto-be \
  --image "$IMAGE" \
  --region "$REGION" \
  --service-account "$SA" \
  --allow-unauthenticated \
  --add-cloudsql-instances "$CONN" \
  `# --update-env-vars: CỘNG DỒN, giữ nguyên các biến R2_*/CRM_*/ANALYTICS_* đã set ở script khác.` \
  `# (Trước đây --set-env-vars XÓA SẠCH env cũ mỗi lần deploy → mất R2/CRM, upload ảnh chết im lặng.)` \
  --update-env-vars "DATABASE_URL=$DATABASE_URL,JWT_SECRET=$JWT_SECRET,JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET,JWT_EXPIRES=1h,JWT_REFRESH_EXPIRES=7d" \
  --labels app=doreto || { echo "❌ DEPLOY BE THẤT BẠI (có thể migrate lỗi quyền — xem log Cloud Run)"; exit 1; }

BE_URL=$(gcloud run services describe doreto-be --region "$REGION" --format="value(status.url)")
echo "BE_URL=$BE_URL" > "$SCRATCH/doreto-be-url.env"
echo ""; echo "===== ✅ XONG BE: $BE_URL ====="
