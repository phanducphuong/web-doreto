// Hằng số module analytics (phase 39) — đầu CUNG số liệu funnel/chuyển đổi cho CRM.
// Tên route + tên field/env đều TỔNG QUÁT (D-02): web sau (thời trang) chỉ cần
// implement đúng hợp đồng là cắm vào CRM, định danh site nằm ở GIÁ TRỊ env site/line.

// Import lại giới hạn khoảng ngày (62) từ tracking — KHÔNG khai số 62 lần hai.
import { TRACKING_REPORT_MAX_RANGE_DAYS } from '../tracking/tracking.constants';

// Version hợp đồng API analytics (D-02) — CRM đối chiếu để phòng lệch schema.
export const ANALYTICS_API_VERSION = 1;

// Secret bảo vệ endpoint (chiều decor → CRM gọi vào). Header KHÁC x-webhook-secret
// của luồng lead phase 38 vì là secret/chiều khác.
export const ANALYTICS_SECRET_ENV = 'ANALYTICS_API_SECRET';
export const ANALYTICS_SECRET_HEADER = 'x-analytics-secret';

// Định danh site/line nằm ở GIÁ TRỊ env (mỗi web override), default = doreto thời trang.
export const ANALYTICS_SITE_ID_ENV = 'ANALYTICS_SITE_ID';
export const ANALYTICS_SITE_ID_DEFAULT = 'doreto-web';
export const ANALYTICS_SITE_LINE_ENV = 'ANALYTICS_SITE_LINE';
export const ANALYTICS_SITE_LINE_DEFAULT = 'THOI_TRANG';

// Ngưỡng idle 30 phút (D-07): sessionId dùng lại sau nhiều giờ KHÔNG được thổi
// phồng thời lượng — clamp lastActivityAt − createdAt về tối đa 1800 giây.
export const ANALYTICS_SESSION_MAX_DURATION_SECONDS = 1800;

// 00:00 giờ VN = 17:00 UTC hôm trước (mirror tracking.service.ts dòng 13).
export const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

// Giới hạn khoảng ngày endpoint summary — dùng lại hằng của tracking (62).
export const ANALYTICS_REPORT_MAX_RANGE_DAYS = TRACKING_REPORT_MAX_RANGE_DAYS;
