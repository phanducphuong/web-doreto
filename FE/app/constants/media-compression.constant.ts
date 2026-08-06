export type TMediaCompressionPreset =
  | "description"
  | "product"
  | "thumbnail"
  | "option"
  | "feedback";

export type TMediaCompressionOptions = {
  maxWidth: number;
};

/**
 * Giới hạn dung lượng ảnh upload: ảnh > 500KB sẽ tự nén cho tới khi ≤ 500KB,
 * ảnh ≤ 500KB giữ nguyên không đụng tới. BE cũng chặn lại mức này (sharp).
 */
export const IMAGE_UPLOAD_MAX_BYTES = 500 * 1024;

/** Các mức quality thử lần lượt khi nén — bắt đầu cao để giữ chất lượng. */
export const IMAGE_COMPRESSION_QUALITY_STEPS = [0.92, 0.87, 0.82, 0.75, 0.68, 0.6] as const;

/** Khi hạ hết quality mà vẫn to: thu nhỏ dần theo tỉ lệ này. */
export const IMAGE_COMPRESSION_DOWNSCALE_RATIO = 0.85;

/** Không thu nhỏ ảnh hẹp hơn mức này (px) để tránh vỡ hình. */
export const IMAGE_COMPRESSION_MIN_WIDTH = 640;

/** Cùng maxWidth với NuxtImg width="1248" format="webp" trên trang chủ. */
export const MEDIA_COMPRESSION_PRESETS: Record<TMediaCompressionPreset, TMediaCompressionOptions> =
  {
    description: {
      maxWidth: 1248,
    },
    product: {
      maxWidth: 1248,
    },
    thumbnail: {
      maxWidth: 600,
    },
    option: {
      maxWidth: 800,
    },
    feedback: {
      maxWidth: 800,
    },
  };

export const DEFAULT_UPLOAD_COMPRESSION_PRESET: TMediaCompressionPreset = "feedback";
