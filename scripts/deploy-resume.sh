#!/usr/bin/env bash
# Tiếp tục deploy: BE image đã build sẵn → deploy thẳng; rồi build + deploy FE.
set -uo pipefail
export CLOUDSDK_PYTHON="$HOME/.local/python-gcloud/bin/python3.12"
export PATH="$HOME/.local/google-cloud-sdk/bin:$PATH"

PROJECT="project-ca44e667-92ed-44a7-b3d"
REGION="asia-southeast1"
CONN="$PROJECT:$REGION:crm-pl-prod"
SA="doreto-run@$PROJECT.iam.gserviceaccount.com"
SCRATCH="/private/tmp/claude-501/-Users-phanphuong02-Projects-web-doreto/1904bfef-4898-4045-bf31-fa76b8cf6343/scratchpad"
IMAGE_BE="$REGION-docker.pkg.dev/$PROJECT/doreto-docker/doreto-be:latest"
IMAGE_FE="$REGION-docker.pkg.dev/$PROJECT/doreto-docker/doreto-fe:latest"
ROOT="/Users/phanphuong02/Projects/web doreto"

# shellcheck disable=SC1090
source "$SCRATCH/doreto-secrets.env"
: "${DATABASE_URL:?DATABASE_URL rỗng — kiểm tra file secret}"
cd "$ROOT" || exit 1

echo "############ DEPLOY BACKEND (image có sẵn) ############"
gcloud run deploy doreto-be \
  --image "$IMAGE_BE" --region "$REGION" --service-account "$SA" \
  --allow-unauthenticated --add-cloudsql-instances "$CONN" \
  --set-env-vars "DATABASE_URL=$DATABASE_URL,JWT_SECRET=$JWT_SECRET,JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET,JWT_EXPIRES=1h,JWT_REFRESH_EXPIRES=7d" \
  --labels app=doreto || { echo "❌ DEPLOY BE THẤT BẠI — xem log Cloud Run (nghi migrate lỗi quyền DB)"; exit 1; }

BE_URL=$(gcloud run services describe doreto-be --region "$REGION" --format="value(status.url)")
echo "BE_URL=$BE_URL" > "$SCRATCH/doreto-be-url.env"
echo "✅ Backend: $BE_URL"

echo "############ BUILD FRONTEND ############"
gcloud builds submit ./FE --tag "$IMAGE_FE" || { echo "❌ BUILD FE THẤT BẠI"; exit 1; }

echo "############ DEPLOY FRONTEND ############"
gcloud run deploy doreto-fe \
  --image "$IMAGE_FE" --region "$REGION" --service-account "$SA" \
  --allow-unauthenticated \
  --set-env-vars "NUXT_PUBLIC_API_BASE_URL=$BE_URL" \
  --labels app=doreto || { echo "❌ DEPLOY FE THẤT BẠI"; exit 1; }

FE_URL=$(gcloud run services describe doreto-fe --region "$REGION" --format="value(status.url)")
echo "FE_URL=$FE_URL" >> "$SCRATCH/doreto-be-url.env"

echo ""
echo "======================================================"
echo "✅ HOÀN TẤT DEPLOY DORETO"
echo "  Backend : $BE_URL"
echo "  Frontend: $FE_URL"
echo "======================================================"
