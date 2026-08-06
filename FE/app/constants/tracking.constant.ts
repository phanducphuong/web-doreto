// Hằng số tracking khách ẩn danh (phase 37 — nền web decor).
// Tách riêng để đổi tên cookie / số ngày sống mà không phải sửa plugin (D-02, D-04).

// Tên cookie chứa visitor_id ẩn danh (UUID v4) — first-party, không PII (D-04).
export const VISITOR_COOKIE_NAME = "visitor_id";

// Tên cookie chứa snapshot attribution { camp, utm } — nay theo LAST-TOUCH (mã camp mới nhất
// khách vào, cố ý đổi từ first-touch theo yêu cầu PO). GIỮ chuỗi khóa "first_touch" không đổi
// để không mất attribution của khách hiện có (chỉ đổi hành vi ghi ở plugin, không đổi tên khóa).
export const FIRST_TOUCH_COOKIE_NAME = "first_touch";

// Cửa sổ attribution last-touch: ~30 ngày, gia hạn mỗi lượt vào có camp (D-02 — đổi ở đây là đổi toàn hệ).
export const FIRST_TOUCH_MAX_AGE_DAYS = 30;

// Visitor sống lâu hơn cửa sổ attribution để nhận diện khách quay lại nhiều lần
// (quyết định thuộc discretion — 1 năm; hết hạn coi như khách mới).
export const VISITOR_COOKIE_MAX_AGE_DAYS = 365;

// Khóa sessionStorage giữ id phiên — mất khi đóng tab = ranh giới phiên tự nhiên.
export const TRACKING_SESSION_STORAGE_KEY = "tracking_session_id";
