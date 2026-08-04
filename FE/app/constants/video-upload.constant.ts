import type { TVideoUploadErrorCode } from "~/types/video-upload.type";

export const VIDEO_UPLOAD_MAX_BYTES = 524_288_000;

export const VIDEO_UPLOAD_ERROR_MESSAGES: Record<TVideoUploadErrorCode, string> = {
  VIDEO_UPLOAD_INVALID_TYPE: "Định dạng video không được hỗ trợ.",
  VIDEO_UPLOAD_FILE_TOO_LARGE: "Video vượt quá dung lượng cho phép.",
  VIDEO_UPLOAD_INVALID_OBJECT_KEY: "Khóa upload video không hợp lệ.",
  VIDEO_UPLOAD_COMPLETE_MISMATCH: "Thông tin video upload không khớp.",
  VIDEO_UPLOAD_OBJECT_NOT_FOUND: "Không tìm thấy file video trên storage.",
  VIDEO_UPLOAD_PRESIGN_FAILED: "Không thể tạo link upload video.",
};
