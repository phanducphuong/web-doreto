import { Injectable, Logger } from '@nestjs/common';
import {
  CRM_WEBHOOK_SECRET_ENV,
  CRM_WEBHOOK_URL_ENV,
  WEBHOOK_HEADER,
  WEBHOOK_TIMEOUT_MS,
} from './crm-lead-outbox.constants';

// Kết quả gửi webhook — KHÔNG throw ra ngoài để luồng gửi lead không làm hỏng
// luồng đặt hàng. ok=false + status/error để service quyết định retry/backoff.
export interface CrmWebhookResult {
  ok: boolean;
  status?: number;
  error?: string;
}

/**
 * Client POST payload lead sang webhook CRM (D-01).
 * - HTTP bằng global fetch (Node 22) — không thêm dependency HTTP nào.
 * - Timeout bằng AbortSignal.timeout — chống fetch treo (T-38-12).
 * - Secret qua header x-webhook-secret, chỉ đọc từ env (T-38-10), KHÔNG log secret.
 * - KHÔNG log payload (PII phone/name — T-38-11); chỉ log status/error.
 * - Mọi lỗi (timeout/mạng/env thiếu) nuốt thành { ok: false } — KHÔNG throw.
 */
@Injectable()
export class CrmWebhookClient {
  private readonly logger = new Logger(CrmWebhookClient.name);
  // Chỉ warn thiếu URL 1 lần để không spam log mỗi lượt flush.
  private warnedMissingUrl = false;

  async post(payload: unknown): Promise<CrmWebhookResult> {
    const url = process.env[CRM_WEBHOOK_URL_ENV];
    const secret = process.env[CRM_WEBHOOK_SECRET_ENV];

    if (!url) {
      if (!this.warnedMissingUrl) {
        this.logger.warn(
          `Thiếu env ${CRM_WEBHOOK_URL_ENV} — không gửi lead sang CRM, row ở lại pending`,
        );
        this.warnedMissingUrl = true;
      }
      return { ok: false, error: `missing ${CRM_WEBHOOK_URL_ENV}` };
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [WEBHOOK_HEADER]: secret ?? '',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
      });

      if (res.status >= 200 && res.status < 300) {
        return { ok: true, status: res.status };
      }
      // 4xx/5xx (vd 401 sai secret) → giữ pending + retry, KHÔNG mất lead
      this.logger.warn(`Webhook CRM trả status ${res.status}`);
      return { ok: false, status: res.status };
    } catch (error) {
      // Timeout / lỗi mạng — nuốt, chỉ log message (không payload)
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Gọi webhook CRM lỗi: ${message}`);
      return { ok: false, error: message };
    }
  }
}
