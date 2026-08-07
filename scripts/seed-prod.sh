#!/usr/bin/env bash
# Seed tài khoản admin vào DB production doreto_web (qua Cloud SQL Auth Proxy).
# Chỉ tạo admin@doreto.com / admin123 — KHÔNG kéo dữ liệu decor.
set -uo pipefail
export CLOUDSDK_PYTHON="$HOME/.local/python-gcloud/bin/python3.12"
export PATH="$HOME/.local/google-cloud-sdk/bin:$PATH"

PROJECT="project-ca44e667-92ed-44a7-b3d"
REGION="asia-southeast1"
CONN="$PROJECT:$REGION:crm-pl-prod"
PROXY_PORT=6543
SCRATCH="/private/tmp/claude-501/-Users-phanphuong02-Projects-web-doreto/1904bfef-4898-4045-bf31-fa76b8cf6343/scratchpad"
ROOT="/Users/phanphuong02/Projects/web doreto"

# shellcheck disable=SC1090
source "$SCRATCH/doreto-secrets.env"
: "${DB_PW:?DB_PW rỗng — kiểm tra file secret}"

echo "== Bật Cloud SQL Auth Proxy (cổng $PROXY_PORT) =="
"$HOME/.local/bin/cloud-sql-proxy" "$CONN" --port "$PROXY_PORT" &
PROXY_PID=$!
trap 'echo "== Tắt proxy =="; kill "$PROXY_PID" 2>/dev/null' EXIT

# Chờ proxy mở cổng (tối đa ~20s)
for i in $(seq 1 20); do
  if nc -z localhost "$PROXY_PORT" 2>/dev/null; then echo "  proxy sẵn sàng"; break; fi
  sleep 1
done

echo "== Chạy seed admin =="
cd "$ROOT" || exit 1
DATABASE_URL="postgresql://doreto_app:${DB_PW}@localhost:${PROXY_PORT}/doreto_web?schema=public" \
  pnpm --dir BE seed

echo "== XONG seed (proxy sẽ tự tắt) =="
