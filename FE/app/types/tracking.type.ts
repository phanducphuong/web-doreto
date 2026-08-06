// Kiểu dữ liệu cho lớp tracking FE (phase 37).
// Khớp DTO BE 37-02 (TrackPageViewDto / TrackEventDto) — sai một field là attribution rơi im lặng.

// 5 loại event funnel (D-05) — khớp whitelist BE (VISITOR_EVENT_TYPES).
export type TVisitorEventType =
  | "product_view"
  | "add_to_cart"
  | "begin_checkout"
  | "order_success"
  | "contact_form";

// Tham số utm_* lưu NGUYÊN VĂN từ URL, không map gì (D-03) — khớp UtmDto BE.
export type TTrackingUtm = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
};

// Snapshot first-touch lưu trong cookie: mã camp + utm chụp từ URL đầu tiên.
export type TFirstTouch = {
  camp?: string;
  utm?: TTrackingUtm;
};

// Payload gửi lên POST /tracking/page-view (khớp TrackPageViewDto BE).
export type TTrackPageViewDto = {
  sessionId: string;
  visitorId: string;
  path: string;
  url: string;
  referrer?: string;
  camp?: string;
  utm?: TTrackingUtm;
};

// Payload gửi lên POST /tracking/event (khớp TrackEventDto BE).
export type TTrackEventDto = {
  sessionId: string;
  visitorId: string;
  type: TVisitorEventType;
  camp?: string;
  utm?: TTrackingUtm;
  productId?: string;
  orderId?: string;
};

// Attribution bơm vào payload đơn hàng / liên hệ (37-04 task 3 → DTO BE 37-03).
export type TTrackingAttribution = {
  visitorId?: string;
  camp?: string;
  utm?: TTrackingUtm;
};

// Hình dạng object provide $tracking (plugin 03.tracking.client.ts).
export type TTrackingApi = {
  trackEvent: (
    type: TVisitorEventType,
    extra?: { productId?: string; orderId?: string },
  ) => void;
  getAttribution: () => TTrackingAttribution;
};
