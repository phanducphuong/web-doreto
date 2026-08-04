import {
  DEFAULT_UPLOAD_COMPRESSION_PRESET,
  MEDIA_COMPRESSION_PRESETS,
  type TMediaCompressionOptions,
  type TMediaCompressionPreset,
} from "~/constants/media-compression.constant";

const SKIP_MIME_TYPES = new Set(["image/gif", "image/svg+xml"]);

/** JPEG tạm trên client — BE Sharp sẽ chuyển sang WebP chất lượng như Nuxt Image. */
const CLIENT_INTERIM_JPEG_QUALITY = 0.88;

function buildJpegFileName(fileName: string): string {
  const baseName = fileName.replace(/\.[^/.]+$/, "").trim() || "image";
  return `${baseName}.jpg`;
}

function resolveCompressionOptions(
  presetOrOptions?: TMediaCompressionPreset | TMediaCompressionOptions,
): TMediaCompressionOptions {
  if (!presetOrOptions) {
    return MEDIA_COMPRESSION_PRESETS[DEFAULT_UPLOAD_COMPRESSION_PRESET];
  }

  if (typeof presetOrOptions === "string") {
    return MEDIA_COMPRESSION_PRESETS[presetOrOptions];
  }

  return presetOrOptions;
}

export function isCompressibleImage(file: File): boolean {
  const mime = file.type.toLowerCase();

  if (!mime) {
    return /\.(jpe?g|png|webp|bmp|avif|heic|heif)$/i.test(file.name);
  }

  if (SKIP_MIME_TYPES.has(mime)) {
    return false;
  }

  return mime.startsWith("image/");
}

function computeTargetSize(
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number,
): { width: number; height: number } {
  const scale = Math.min(1, maxWidth / sourceWidth);
  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale)),
  };
}

async function probeImageSize(file: File): Promise<{ width: number; height: number } | null> {
  const objectUrl = URL.createObjectURL(file);

  try {
    if (typeof createImageBitmap === "function") {
      try {
        const bitmap = await createImageBitmap(file);
        const size = { width: bitmap.width, height: bitmap.height };
        bitmap.close();
        return size;
      } catch {
        // fallback below
      }
    }

    return await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const element = new Image();
      element.onload = () => {
        resolve({ width: element.naturalWidth, height: element.naturalHeight });
      };
      element.onerror = () => reject(new Error("Failed to probe image"));
      element.src = objectUrl;
    });
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function resizeToCanvas(
  file: File,
  targetWidth: number,
  targetHeight: number,
): Promise<HTMLCanvasElement | null> {
  let bitmap: ImageBitmap | null = null;

  try {
    if (typeof createImageBitmap === "function") {
      try {
        bitmap = await createImageBitmap(file, {
          resizeWidth: targetWidth,
          resizeHeight: targetHeight,
          resizeQuality: "high",
        });
      } catch {
        bitmap = await createImageBitmap(file);
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }

    if (bitmap) {
      context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
      return canvas;
    }

    const objectUrl = URL.createObjectURL(file);
    try {
      const element = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Failed to load image"));
        image.src = objectUrl;
      });
      context.drawImage(element, 0, 0, targetWidth, targetHeight);
      return canvas;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return null;
  } finally {
    bitmap?.close();
  }
}

async function canvasToJpegFile(canvas: HTMLCanvasElement, fileName: string): Promise<File | null> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", CLIENT_INTERIM_JPEG_QUALITY);
  });

  if (!blob) {
    return null;
  }

  return new File([blob], buildJpegFileName(fileName), {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

/**
 * Resize ảnh trên client để giảm băng thông upload.
 * Nén WebP chất lượng cao (như Nuxt Image) do BE Sharp xử lý.
 */
export async function compressImageFile(
  file: File,
  presetOrOptions:
    | TMediaCompressionPreset
    | TMediaCompressionOptions = DEFAULT_UPLOAD_COMPRESSION_PRESET,
): Promise<File> {
  if (!import.meta.client || !isCompressibleImage(file)) {
    return file;
  }

  const options = resolveCompressionOptions(presetOrOptions);

  try {
    const sourceSize = await probeImageSize(file);
    if (!sourceSize?.width || !sourceSize?.height) {
      console.warn("[media-compression] Probe failed, BE will compress:", file.name);
      return file;
    }

    const { width, height } = computeTargetSize(
      sourceSize.width,
      sourceSize.height,
      options.maxWidth,
    );

    if (width === sourceSize.width && height === sourceSize.height && file.type === "image/jpeg") {
      return file;
    }

    const canvas = await resizeToCanvas(file, width, height);
    if (!canvas) {
      console.warn("[media-compression] Resize failed, BE will compress:", file.name);
      return file;
    }

    const resized = await canvasToJpegFile(canvas, file.name);
    if (!resized) {
      console.warn("[media-compression] JPEG encode failed, BE will compress:", file.name);
      return file;
    }

    if (import.meta.dev) {
      console.info(
        `[media-compression] ${file.name}: ${(file.size / 1024).toFixed(0)}KB → ${(resized.size / 1024).toFixed(0)}KB (${width}x${height}, interim JPEG)`,
      );
    }

    return resized;
  } catch (error) {
    console.warn("[media-compression] Client resize skipped:", file.name, error);
    return file;
  }
}

export async function compressImageFiles(
  files: File[],
  presetOrOptions:
    | TMediaCompressionPreset
    | TMediaCompressionOptions = DEFAULT_UPLOAD_COMPRESSION_PRESET,
): Promise<File[]> {
  return Promise.all(files.map((file) => compressImageFile(file, presetOrOptions)));
}
