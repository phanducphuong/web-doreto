import type { TVideoUploadErrorCode } from "~/types/video-upload.type";

/**
 * Giới hạn video upload: > 50MB sẽ tự nén (WebCodecs) về ≤ 50MB trước khi tải
 * lên R2; ≤ 50MB giữ nguyên. BE cũng từ chối presign nếu size > 50MB.
 */
export const VIDEO_UPLOAD_MAX_BYTES = 50 * 1024 * 1024;

/** Chặn file nguồn quá lớn để không treo trình duyệt khi nén. */
export const VIDEO_UPLOAD_MAX_SOURCE_BYTES = 500 * 1024 * 1024;

/** Chừa ~8% dung lượng cho container/metadata khi tính bitrate mục tiêu. */
export const VIDEO_COMPRESSION_SIZE_SAFETY = 0.92;

export const VIDEO_COMPRESSION_AUDIO_BITRATE = 128_000;

/** Dưới mức này hình sẽ vỡ nặng — coi như video quá dài để nén về 50MB. */
export const VIDEO_COMPRESSION_MIN_VIDEO_BITRATE = 300_000;

/** Không cần bitrate cao hơn mức này cho video mô tả trên web. */
export const VIDEO_COMPRESSION_MAX_VIDEO_BITRATE = 8_000_000;

export const VIDEO_COMPRESSION_MAX_WIDTH = 1920;

export const VIDEO_UPLOAD_ERROR_MESSAGES: Record<TVideoUploadErrorCode, string> = {
  VIDEO_UPLOAD_INVALID_TYPE: "Định dạng video không được hỗ trợ.",
  VIDEO_UPLOAD_FILE_TOO_LARGE: "Video vượt quá dung lượng cho phép (50MB).",
  VIDEO_UPLOAD_INVALID_OBJECT_KEY: "Khóa upload video không hợp lệ.",
  VIDEO_UPLOAD_COMPLETE_MISMATCH: "Thông tin video upload không khớp.",
  VIDEO_UPLOAD_OBJECT_NOT_FOUND: "Không tìm thấy file video trên storage.",
  VIDEO_UPLOAD_PRESIGN_FAILED: "Không thể tạo link upload video.",
};
