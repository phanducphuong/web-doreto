export const FEEDBACK_UPLOAD_MAX_FILES = 8;
export const FEEDBACK_REPLY_UPLOAD_MAX_FILES = 8;

export const FEEDBACK_QUERY_KEYS = {
  list: (productId: number | string) => `feedback-products:${productId}:list`,
  summary: (productId: number | string) => `feedback-products:${productId}:summary`,
  mine: (productId: number | string) => `feedback-products:${productId}:mine`,
  management: "feedback-products:management",
  purchaseStatus: (productId: number | string) => `feedback-products:${productId}:purchase-status`,
};

export const FEEDBACK_MESSAGES = {
  authRequired: "Đăng nhập để gửi đánh giá cho sản phẩm này.",
  purchaseRequired: "Bạn chỉ có thể đánh giá sau khi đã mua sản phẩm.",
  invalidComposer: "Vui lòng nhập nhận xét, chọn số sao hoặc thêm ít nhất một ảnh.",
  invalidReply: "Phản hồi của admin cần có nội dung hoặc ít nhất một ảnh đính kèm.",
  loadListFailed: "Không tải được danh sách đánh giá.",
  loadSummaryFailed: "Không tải được tổng quan đánh giá.",
  loadMineFailed: "Không tải được đánh giá của bạn.",
  loadManagementFailed: "Không tải được danh sách feedback quản trị.",
  uploadFailed: "Tải ảnh lên thất bại.",
  deleteFailed: "Xóa đánh giá thất bại.",
  replyLocked: "Phản hồi này đã được admin chốt và không thể chỉnh sửa.",
  adminReadonly: "Tài khoản quản trị chỉ có thể phản hồi từng đánh giá, không tạo đánh giá mới.",
};
