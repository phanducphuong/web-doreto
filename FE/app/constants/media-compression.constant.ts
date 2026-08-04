export type TMediaCompressionPreset =
  | "description"
  | "product"
  | "thumbnail"
  | "option"
  | "feedback";

export type TMediaCompressionOptions = {
  maxWidth: number;
  /** Dung lượng mục tiêu sau khi BE Sharp nén WebP (bytes). */
  maxBytes: number;
};

/** Cùng maxWidth với NuxtImg width="1248" format="webp" trên trang chủ. */
export const MEDIA_COMPRESSION_PRESETS: Record<TMediaCompressionPreset, TMediaCompressionOptions> =
  {
    description: {
      maxWidth: 1248,
      maxBytes: 160_000,
    },
    product: {
      maxWidth: 1248,
      maxBytes: 180_000,
    },
    thumbnail: {
      maxWidth: 600,
      maxBytes: 90_000,
    },
    option: {
      maxWidth: 800,
      maxBytes: 120_000,
    },
    feedback: {
      maxWidth: 800,
      maxBytes: 120_000,
    },
  };

export const DEFAULT_UPLOAD_COMPRESSION_PRESET: TMediaCompressionPreset = "feedback";

/** Sharp WebP quality khởi đầu — tương đương IPX/Nuxt Image mặc định. */
export const MEDIA_COMPRESSION_SHARP_INITIAL_QUALITY = 80;

/** Sharp WebP quality tối thiểu khi ép giảm dung lượng. */
export const MEDIA_COMPRESSION_SHARP_MIN_QUALITY = 45;
