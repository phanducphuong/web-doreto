import {
  DEFAULT_UPLOAD_COMPRESSION_PRESET,
  IMAGE_COMPRESSION_DOWNSCALE_RATIO,
  IMAGE_COMPRESSION_MIN_WIDTH,
  IMAGE_COMPRESSION_QUALITY_STEPS,
  IMAGE_UPLOAD_MAX_BYTES,
  MEDIA_COMPRESSION_PRESETS,
  type TMediaCompressionOptions,
  type TMediaCompressionPreset,
} from "~/constants/media-compression.constant";

const SKIP_MIME_TYPES = new Set(["image/gif", "image/svg+xml"]);

function replaceExtension(fileName: string, extension: string): string {
  const baseName = fileName.replace(/\.[^/.]+$/, "").trim() || "image";
  return `${baseName}.${extension}`;
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

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, mime, quality);
  });
}

type TEncodedImage = { blob: Blob; extension: string; mime: string };

/**
 * Nén canvas ở một mức quality: ưu tiên WebP (giữ được nền trong suốt, nhẹ hơn);
 * trình duyệt không encode được WebP (Safari cũ) thì rơi về JPEG nền trắng.
 */
async function encodeCanvas(
  canvas: HTMLCanvasElement,
  quality: number,
  whiteCanvasCache: { canvas: HTMLCanvasElement | null },
): Promise<TEncodedImage | null> {
  const webp = await canvasToBlob(canvas, "image/webp", quality);
  if (webp && webp.type === "image/webp") {
    return { blob: webp, extension: "webp", mime: "image/webp" };
  }

  if (!whiteCanvasCache.canvas) {
    const whiteCanvas = document.createElement("canvas");
    whiteCanvas.width = canvas.width;
    whiteCanvas.height = canvas.height;
    const context = whiteCanvas.getContext("2d");
    if (!context) return null;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, whiteCanvas.width, whiteCanvas.height);
    context.drawImage(canvas, 0, 0);
    whiteCanvasCache.canvas = whiteCanvas;
  }

  const jpeg = await canvasToBlob(whiteCanvasCache.canvas, "image/jpeg", quality);
  if (!jpeg) return null;
  return { blob: jpeg, extension: "jpg", mime: "image/jpeg" };
}

/**
 * Ảnh > 500KB: resize về maxWidth của preset rồi hạ quality từng nấc (bắt đầu
 * 0.92 để giữ chất lượng) cho tới khi ≤ 500KB; cùng lắm mới thu nhỏ kích thước.
 * Ảnh ≤ 500KB: GIỮ NGUYÊN, không đụng tới.
 * Thất bại ở bước nào thì gửi file gốc — BE (sharp) sẽ nén chặn hậu.
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

  if (file.size <= IMAGE_UPLOAD_MAX_BYTES) {
    return file;
  }

  const options = resolveCompressionOptions(presetOrOptions);

  try {
    const sourceSize = await probeImageSize(file);
    if (!sourceSize?.width || !sourceSize?.height) {
      console.warn("[media-compression] Probe failed, BE will compress:", file.name);
      return file;
    }

    let { width, height } = computeTargetSize(sourceSize.width, sourceSize.height, options.maxWidth);
    let bestEffort: TEncodedImage | null = null;

    while (width >= 1 && height >= 1) {
      const canvas = await resizeToCanvas(file, width, height);
      if (!canvas) {
        console.warn("[media-compression] Resize failed, BE will compress:", file.name);
        return file;
      }

      const whiteCanvasCache: { canvas: HTMLCanvasElement | null } = { canvas: null };

      for (const quality of IMAGE_COMPRESSION_QUALITY_STEPS) {
        const encoded = await encodeCanvas(canvas, quality, whiteCanvasCache);
        if (!encoded) continue;

        if (!bestEffort || encoded.blob.size < bestEffort.blob.size) {
          bestEffort = encoded;
        }

        if (encoded.blob.size <= IMAGE_UPLOAD_MAX_BYTES) {
          const result = new File([encoded.blob], replaceExtension(file.name, encoded.extension), {
            type: encoded.mime,
            lastModified: Date.now(),
          });

          if (import.meta.dev) {
            console.info(
              `[media-compression] ${file.name}: ${(file.size / 1024).toFixed(0)}KB → ${(result.size / 1024).toFixed(0)}KB (${canvas.width}x${canvas.height}, q=${quality}, ${encoded.extension})`,
            );
          }

          return result;
        }
      }

      // Hạ hết quality vẫn > 500KB → thu nhỏ kích thước rồi thử lại.
      if (width <= IMAGE_COMPRESSION_MIN_WIDTH) break;
      width = Math.max(IMAGE_COMPRESSION_MIN_WIDTH, Math.round(width * IMAGE_COMPRESSION_DOWNSCALE_RATIO));
      height = Math.max(1, Math.round((sourceSize.height / sourceSize.width) * width));
    }

    // Không ép được xuống 500KB (ảnh cực đặc biệt) → dùng bản nhỏ nhất đã nén được.
    if (bestEffort && bestEffort.blob.size < file.size) {
      return new File([bestEffort.blob], replaceExtension(file.name, bestEffort.extension), {
        type: bestEffort.mime,
        lastModified: Date.now(),
      });
    }

    return file;
  } catch (error) {
    console.warn("[media-compression] Client compress skipped:", file.name, error);
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
