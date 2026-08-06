// Hằng số cho module tracking hành vi khách (phase 37).

// Whitelist 5 loại sự kiện funnel (D-05) — type trong DB là String,
// thêm loại mới chỉ cần sửa mảng này, không cần migration.
export const VISITOR_EVENT_TYPES = [
  'product_view',
  'add_to_cart',
  'begin_checkout',
  'order_success',
  'contact_form',
] as const;

export type VisitorEventType = (typeof VISITOR_EVENT_TYPES)[number];

// Nhận diện bot qua user-agent phổ biến (D-09) — mức hợp lý, không over-engineer.
// UA rỗng/lạ KHÔNG coi là bot (app WebView có thể gửi UA không chuẩn).
export const BOT_UA_REGEX =
  /bot|crawler|spider|crawling|facebookexternalhit|slurp|bingpreview|headless|lighthouse/i;

// Khoảng ngày tối đa cho endpoint báo cáo daily (tránh rebuild quá nặng một lần).
export const TRACKING_REPORT_MAX_RANGE_DAYS = 62;
