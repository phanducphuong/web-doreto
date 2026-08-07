#!/usr/bin/env bash
# Build lại + deploy doreto-fe (sau khi đổi nuxt.config: thêm host ảnh r2.dev vào allowlist).
set -uo pipefail
export CLOUDSDK_PYTHON="$HOME/.local/python-gcloud/bin/python3.12"
export PATH="$HOME/.local/google-cloud-sdk/bin:$PATH"

PROJECT="project-ca44e667-92ed-44a7-b3d"
REGION="asia-southeast1"
SA="doreto-run@$PROJECT.iam.gserviceaccount.com"
IMAGE_FE="$REGION-docker.pkg.dev/$PROJECT/doreto-docker/doreto-fe:latest"
BE_URL="https://doreto-be-p2r2izf7sq-as.a.run.app"
ROOT="/Users/phanphuong02/Projects/web doreto"

cd "$ROOT" || exit 1

echo "===== BUILD FE image ====="
gcloud builds submit ./FE --tag "$IMAGE_FE" || { echo "❌ BUILD FE THẤT BẠI"; exit 1; }

echo "===== DEPLOY doreto-fe ====="
gcloud run deploy doreto-fe \
  --image "$IMAGE_FE" --region "$REGION" --service-account "$SA" \
  --allow-unauthenticated \
  --set-env-vars "NUXT_PUBLIC_API_BASE_URL=$BE_URL" \
  --labels app=doreto || { echo "❌ DEPLOY FE THẤT BẠI"; exit 1; }

echo "✅ FE đã deploy lại: $(gcloud run services describe doreto-fe --region "$REGION" --format='value(status.url)')"
