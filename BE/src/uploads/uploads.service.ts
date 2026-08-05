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

// Ảnh và video đều đẩy lên Cloudflare R2 (S3-compatible), giống dự án decor.
// Trả về shape { secure_url, public_id, bytes, format } để controller/FE giữ nguyên.
type R2UploadResult = {
  secure_url: string;
  public_id: string;
  bytes: number;
  format?: string;
};

/** GIF (động) và SVG nén qua sharp sẽ hỏng — bỏ qua nén. */
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

  /** Upload nguyên bản (ảnh giữ nguyên, file khác giữ nguyên). */
  async saveFile(file: File): Promise<R2UploadResult> {
    const buffer = file.buffer as Buffer;
    const ext = this.extFromMime(
      file.mimetype,
      file.originalname.split('.').pop() || 'bin',
    );
    return this.putObject(buffer, file.originalname, file.mimetype, ext);
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
        .resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true })
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
