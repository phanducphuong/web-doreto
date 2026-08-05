import { BadRequestException } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';

// Cấu hình Cloudflare R2 (S3-compatible) đọc từ biến môi trường.
// Mỗi dự án dùng bucket riêng để không chồng chéo file — doreto mặc định 'doreto-web'.

let cachedClient: S3Client | null = null;

export function r2Bucket(): string {
  return process.env.R2_BUCKET_NAME || 'doreto-web';
}

export function r2Folder(): string {
  return (process.env.R2_FOLDER || 'doreto').replace(/^\/+|\/+$/g, '');
}

export function r2PublicBaseUrl(): string {
  return (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '');
}

export function r2PublicUrl(objectKey: string): string {
  return `${r2PublicBaseUrl()}/${objectKey}`;
}

export function getR2Client(): S3Client {
  if (cachedClient) return cachedClient;

  const accountId = process.env.R2_ACCOUNT_ID;
  const endpoint =
    process.env.R2_ENDPOINT ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '');
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new BadRequestException({
      code: 'R2_NOT_CONFIGURED',
      message:
        'Server chưa cấu hình Cloudflare R2 (R2_ENDPOINT/R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY).',
    });
  }

  cachedClient = new S3Client({
    region: 'auto',
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });

  return cachedClient;
}

/** Bỏ dấu tiếng Việt + chuẩn hóa tên file thành slug an toàn cho object key. */
export function slugifyFileName(fileName: string, fallback = 'file'): string {
  const base = fileName.replace(/\.[^/.]+$/, '');
  const slug = base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || fallback;
}
