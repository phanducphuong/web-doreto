#!/usr/bin/env bash
# Gỡ kẹt SSL: xóa mapping cũ (tạo lúc DNS chưa đúng) rồi tạo lại để Cloud Run kiểm DNS lại từ đầu.
# DNS trên Cloudflare GIỮ NGUYÊN — không phải sửa gì.
set -uo pipefail
export CLOUDSDK_PYTHON="$HOME/.local/python-gcloud/bin/python3.12"
export PATH="$HOME/.local/google-cloud-sdk/bin:$PATH"
REGION="asia-southeast1"

echo "===== Xóa mapping cũ ====="
gcloud beta run domain-mappings delete --domain dorreto.com --region "$REGION" --quiet 2>&1 || true
gcloud beta run domain-mappings delete --domain api.dorreto.com --region "$REGION" --quiet 2>&1 || true

echo ""; echo "===== Tạo lại (DNS đã đúng sẵn nên sẽ cấp SSL) ====="
gcloud beta run domain-mappings create --service doreto-fe --domain dorreto.com --region "$REGION" 2>&1 || true
gcloud beta run domain-mappings create --service doreto-be --domain api.dorreto.com --region "$REGION" 2>&1 || true

echo ""; echo "===== Trạng thái sau khi tạo lại ====="
for d in dorreto.com api.dorreto.com; do
  echo -n "$d: "
  gcloud beta run domain-mappings describe --domain "$d" --region "$REGION" --format="value(status.conditions[0].message)" 2>&1 | head -1
done
echo ""; echo "== Xong. SSL thường cấp trong 5-15 phút sau khi tạo lại (DNS đã sẵn). =="
