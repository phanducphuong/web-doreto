#!/usr/bin/env bash
# Bật tích hợp CRM cho doreto-be: dùng CHUNG webhook URL + secret với decor
# (CRM endpoint /crm/leads/decor-web là đa-web, phân biệt qua line=THOI_TRANG doreto đã gửi sẵn).
# Secret được lấy TRỰC TIẾP từ env của decorweb-be — KHÔNG in ra màn hình.
set -uo pipefail
export CLOUDSDK_PYTHON="$HOME/.local/python-gcloud/bin/python3.12"
export PATH="$HOME/.local/google-cloud-sdk/bin:$PATH"
REGION="asia-southeast1"

echo "== Lấy cấu hình CRM từ decorweb-be =="
J=$(gcloud run services describe decorweb-be --region "$REGION" --format=json 2>/dev/null)
read -r CRM_URL CRM_SEC ANA_SEC <<<"$(echo "$J" | python3 -c "
import sys,json
e={x['name']:x.get('value','') for x in json.load(sys.stdin)['spec']['template']['spec']['containers'][0].get('env',[])}
print(e.get('CRM_DECOR_WEBHOOK_URL',''), e.get('CRM_DECOR_WEBHOOK_SECRET',''), e.get('ANALYTICS_API_SECRET',''))
")"

if [ -z "$CRM_URL" ] || [ -z "$CRM_SEC" ]; then
  echo "❌ Không lấy được CRM_DECOR_WEBHOOK_URL/SECRET từ decor. Dừng."; exit 1
fi
echo "  CRM webhook URL (dùng chung): $CRM_URL"
echo "  Secret webhook: (lấy được, ẩn — len=${#CRM_SEC})"
echo "  Analytics secret: (lấy được, ẩn — len=${#ANA_SEC})"

echo ""; echo "== Gắn env CRM + analytics cho doreto-be (không rebuild) =="
gcloud run services update doreto-be --region "$REGION" --update-env-vars \
"CRM_DECOR_WEBHOOK_URL=$CRM_URL,CRM_DECOR_WEBHOOK_SECRET=$CRM_SEC,ANALYTICS_API_SECRET=$ANA_SEC,ANALYTICS_SITE_ID=doreto-web,ANALYTICS_SITE_LINE=THOI_TRANG" \
  && echo "✅ Đã bật CRM cho doreto. Lead đơn/liên hệ sẽ đẩy sang CRM với line=THOI_TRANG."
