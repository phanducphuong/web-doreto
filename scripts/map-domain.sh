#!/usr/bin/env bash
# Map domain vào Cloud Run (y như decor): dorreto.com → doreto-fe, api.dorreto.com → doreto-be.
# CHẠY SAU KHI đã verify ownership dorreto.com với Google (xem hướng dẫn).
set -uo pipefail
export CLOUDSDK_PYTHON="$HOME/.local/python-gcloud/bin/python3.12"
export PATH="$HOME/.local/google-cloud-sdk/bin:$PATH"
REGION="asia-southeast1"

echo "===== Tạo mapping: dorreto.com → doreto-fe ====="
gcloud beta run domain-mappings create --service doreto-fe --domain dorreto.com --region "$REGION" 2>&1 || true

echo ""; echo "===== Tạo mapping: api.dorreto.com → doreto-be ====="
gcloud beta run domain-mappings create --service doreto-be --domain api.dorreto.com --region "$REGION" 2>&1 || true

echo ""; echo "############################################################"
echo "# DNS RECORDS CẦN THÊM VÀO CLOUDFLARE (đặt Proxy = DNS only / xám)"
echo "############################################################"
echo ""; echo "--- dorreto.com (root) ---"
gcloud beta run domain-mappings describe --domain dorreto.com --region "$REGION" \
  --format="table(status.resourceRecords.type, status.resourceRecords.name, status.resourceRecords.rrdata)" 2>&1
echo ""; echo "--- api.dorreto.com ---"
gcloud beta run domain-mappings describe --domain api.dorreto.com --region "$REGION" \
  --format="table(status.resourceRecords.type, status.resourceRecords.name, status.resourceRecords.rrdata)" 2>&1
