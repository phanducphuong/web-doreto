#!/usr/bin/env bash
# Test end-to-end: tạo form liên hệ trên doreto → worker đẩy lead sang CRM → kiểm status outbox.
set -uo pipefail
export CLOUDSDK_PYTHON="$HOME/.local/python-gcloud/bin/python3.12"
export PATH="$HOME/.local/google-cloud-sdk/bin:$PATH"
PROJECT="project-ca44e667-92ed-44a7-b3d"; REGION="asia-southeast1"
CONN="$PROJECT:$REGION:crm-pl-prod"; PROXY_PORT=6544
BE_URL="https://doreto-be-p2r2izf7sq-as.a.run.app"
SCRATCH="/private/tmp/claude-501/-Users-phanphuong02-Projects-web-doreto/1904bfef-4898-4045-bf31-fa76b8cf6343/scratchpad"
# shellcheck disable=SC1090
source "$SCRATCH/doreto-secrets.env"

echo "== 1) Tạo form liên hệ thử trên doreto =="
RESP=$(curl -s -X POST "$BE_URL/contact-requests" -H "Content-Type: application/json" \
  -d '{"name":"Test CRM Doreto","phone":"0900000123"}')
echo "  response: $(echo "$RESP" | cut -c1-160)"

echo "== 2) Chờ worker đẩy sang CRM (12s) =="
sleep 12

echo "== 3) Bật proxy + kiểm outbox =="
"$HOME/.local/bin/cloud-sql-proxy" "$CONN" --port "$PROXY_PORT" >/dev/null 2>&1 &
PID=$!; trap 'kill "$PID" 2>/dev/null' EXIT
for i in $(seq 1 15); do nc -z localhost "$PROXY_PORT" 2>/dev/null && break; sleep 1; done

cd "/Users/phanphuong02/Projects/web doreto/BE" || exit 1
DATABASE_URL="postgresql://doreto_app:${DB_PW}@localhost:${PROXY_PORT}/doreto_web?schema=public" node -e "
const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
p.decorLeadOutbox.findMany({take:10}).then(rows=>{
  if(!rows.length){console.log('  (outbox rỗng — chưa có lead?)');}
  rows.forEach(r=>console.log('  ['+r.sourceKind+'] status='+r.status+' attempts='+r.attempts+' payload.line='+(r.payload&&r.payload.line||'?')+' '+(r.lastError?('ERR: '+r.lastError):'')));
  return p.\$disconnect();
}).catch(e=>{console.error('  query lỗi:',e.message);process.exit(1);});
"
echo "== Diễn giải: status='sent' = CRM đã nhận 2xx ✅ | 'pending' + attempts>0 + lastError = CRM từ chối/lỗi =="
