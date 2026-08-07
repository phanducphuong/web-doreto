#!/usr/bin/env bash
# Map thêm www.dorreto.com → doreto-fe (để khách gõ www. cũng vào được).
# CHẠY SAU KHI dorreto.com đã hoạt động. Sau đó thêm DNS record bên Cloudflare (xem cuối script).
set -uo pipefail
export CLOUDSDK_PYTHON="$HOME/.local/python-gcloud/bin/python3.12"
export PATH="$HOME/.local/google-cloud-sdk/bin:$PATH"
REGION="asia-southeast1"

echo "===== Tạo mapping: www.dorreto.com → doreto-fe ====="
gcloud beta run domain-mappings create --service doreto-fe --domain www.dorreto.com --region "$REGION" 2>&1 || true

echo ""; echo "############################################################"
echo "# DNS RECORD CẦN THÊM VÀO CLOUDFLARE (Proxy = DNS only / xám)"
echo "#   Type: CNAME | Name: www | Target: ghs.googlehosted.com"
echo "############################################################"
gcloud beta run domain-mappings describe --domain www.dorreto.com --region "$REGION" \
  --format="table(status.resourceRecords.type, status.resourceRecords.name, status.resourceRecords.rrdata)" 2>&1
