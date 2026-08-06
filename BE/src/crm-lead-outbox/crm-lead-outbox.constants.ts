// Hằng số module outbox bắn lead sang CRM (phase 38).

// Tên biến env chứa địa chỉ + secret webhook CRM (đặt ở Cloud Run doreto-be).
// Giữ tên biến CRM_DECOR_* dùng chung hợp đồng với CRM — phân biệt web qua URL/secret riêng.
export const CRM_WEBHOOK_URL_ENV = 'CRM_DECOR_WEBHOOK_URL';
export const CRM_WEBHOOK_SECRET_ENV = 'CRM_DECOR_WEBHOOK_SECRET';

// Header secret phải KHỚP guard bên CRM (plan 02 — DecorWebhookSecretGuard).
export const WEBHOOK_HEADER = 'x-webhook-secret';

// Timeout mỗi lần POST webhook (ms) — chống fetch treo làm nghẽn tài nguyên decor.
export const WEBHOOK_TIMEOUT_MS = 5000;

// Chu kỳ worker nền quét outbox pending (ms) ~30s.
export const OUTBOX_FLUSH_INTERVAL_MS = 30000;

// Số lần thử tối đa trước khi mark 'failed' (backoff mũ giữa các lần).
export const OUTBOX_MAX_ATTEMPTS = 8;

// Số row lấy mỗi lượt flush (giới hạn tải).
export const OUTBOX_BATCH_SIZE = 20;

// Whitelist nguồn hợp lệ — service kiểm trước khi enqueue.
export const OUTBOX_SOURCE_KINDS = ['order', 'contact'] as const;
export type OutboxSourceKind = (typeof OUTBOX_SOURCE_KINDS)[number];
