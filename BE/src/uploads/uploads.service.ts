import { Injectable } from '@nestjs/common';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { randomBytes } from 'crypto';
import { File } from 'multer';
import {
  getR2Client,
  r2Bucket,
  r2Folder,
  r2PublicUrl,
  slugifyFileName,
} from './r2.util';

// Ảnh và video đều đẩy lên Cloudflare R2 (S3-compatible).
// Trả về shape { secure_url, public_id, bytes, format } để controller/FE giữ nguyên.
type R2UploadResult = {
  secure_url: string;
  public_id: string;
  bytes: number;
  format?: string;
};

/** Ảnh > 500KB bị nén về ≤ 500KB trước khi upload; ≤ 500KB giữ nguyên. */
const IMAGE_MAX_BYTES = 500 * 1024;
/** Ảnh quá khổ bị thu về tối đa chiều ngang này trước khi thử nén. */
const IMAGE_MAX_WIDTH = 1920;
/** Các mức WebP quality thử lần lượt — bắt đầu cao để giữ chất lượng. */
const IMAGE_WEBP_QUALITY_STEPS = [82, 74, 66, 58, 50];
const IMAGE_DOWNSCALE_RATIO = 0.85;
const IMAGE_MIN_WIDTH = 640;
/** GIF (động) và SVG nén qua sharp sẽ hỏng — bỏ qua. */
const IMAGE_SKIP_COMPRESS_MIMES = new Set(['image/gif', 'image/svg+xml']);

@Injectable()
export class UploadsService {
  private get imagePrefix(): string {
    return `${r2Folder()}/images/`;
  }

  private extFromMime(mimetype: string, fallback: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
      'application/pdf': 'pdf',
    };
    return map[mimetype] || fallback;
  }

  private async putObject(
    buffer: Buffer,
    originalName: string,
    contentType: string,
    ext: string,
  ): Promise<R2UploadResult> {
    const objectKey = `${this.imagePrefix}${Date.now()}-${randomBytes(4).toString(
      'hex',
    )}-${slugifyFileName(originalName, 'file')}.${ext}`;

    await getR2Client().send(
      new PutObjectCommand({
        Bucket: r2Bucket(),
        Key: objectKey,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return {
      secure_url: r2PublicUrl(objectKey),
      public_id: objectKey,
      bytes: buffer.length,
      format: ext,
    };
  }

  /**
   * Nén ảnh về ≤ 500KB (WebP, hạ quality từng nấc rồi mới thu nhỏ kích thước).
   * Ảnh ≤ 500KB, GIF/SVG, hoặc nén lỗi → trả nguyên bản.
   */
  private async compressImageIfNeeded(
    buffer: Buffer,
    mimetype: string,
    originalName: string,
  ): Promise<{
    buffer: Buffer;
    name: string;
    contentType: string;
    ext: string;
  }> {
    const original = {
      buffer,
      name: originalName,
      contentType: mimetype,
      ext: this.extFromMime(
        mimetype,
        originalName.split('.').pop() || 'bin',
      ),
    };

    if (
      buffer.length <= IMAGE_MAX_BYTES ||
      IMAGE_SKIP_COMPRESS_MIMES.has(mimetype)
    ) {
      return original;
    }

    try {
      const metadata = await sharp(buffer).metadata();
      const sourceWidth = metadata.width ?? IMAGE_MAX_WIDTH;
      let width = Math.min(sourceWidth, IMAGE_MAX_WIDTH);
      let bestEffort: Buffer | null = null;

      while (width >= 1) {
        for (const quality of IMAGE_WEBP_QUALITY_STEPS) {
          const compressed = await sharp(buffer)
            .rotate()
            .resize({ width, withoutEnlargement: true })
            .webp({ quality })
            .toBuffer();

          if (!bestEffort || compressed.length < bestEffort.length) {
            bestEffort = compressed;
          }

          if (compressed.length <= IMAGE_MAX_BYTES) {
            return {
              buffer: compressed,
              name: `${originalName.replace(/\.[^/.]+$/, '')}.webp`,
              contentType: 'image/webp',
              ext: 'webp',
            };
          }
        }

        if (width <= IMAGE_MIN_WIDTH) break;
        width = Math.max(
          IMAGE_MIN_WIDTH,
          Math.round(width * IMAGE_DOWNSCALE_RATIO),
        );
      }

      if (bestEffort && bestEffort.length < buffer.length) {
        return {
          buffer: bestEffort,
          name: `${originalName.replace(/\.[^/.]+$/, '')}.webp`,
          contentType: 'image/webp',
          ext: 'webp',
        };
      }

      return original;
    } catch (error) {
      console.warn(
        `Image compression failed for ${originalName}, uploading original:`,
        error,
      );
      return original;
    }
  }

  /** Ảnh > 500KB được nén WebP; ảnh nhỏ và file khác giữ nguyên. Tất cả lên R2. */
  async saveFile(file: File): Promise<R2UploadResult> {
    const isImage = file.mimetype.startsWith('image/');

    if (!isImage) {
      const ext = this.extFromMime(
        file.mimetype,
        file.originalname.split('.').pop() || 'bin',
      );
      return this.putObject(
        file.buffer as Buffer,
        file.originalname,
        file.mimetype,
        ext,
      );
    }

    const { buffer, name, contentType, ext } = await this.compressImageIfNeeded(
      file.buffer as Buffer,
      file.mimetype,
      file.originalname,
    );

    return this.putObject(buffer, name, contentType, ext);
  }

  /** Ảnh: thu về khung maxSize (px) và chuyển WebP để nhẹ; file khác giữ nguyên. */
  async saveFileWithCompression(
    file: File,
    maxSize = 128,
  ): Promise<R2UploadResult> {
    const isImage = file.mimetype.startsWith('image/');

    if (isImage && !IMAGE_SKIP_COMPRESS_MIMES.has(file.mimetype)) {
      const compressedBuffer = await sharp(file.buffer as Buffer)
        .rotate()
        .resize(maxSize, maxSize, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();

      const compressedName = `${file.originalname.replace(/\.[^/.]+$/, '')}.webp`;
      return this.putObject(
        compressedBuffer,
        compressedName,
        'image/webp',
        'webp',
      );
    }

    return this.saveFile(file);
  }
}
