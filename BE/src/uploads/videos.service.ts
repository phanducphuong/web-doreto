import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomBytes } from 'crypto';
import {
  getR2Client,
  r2Bucket,
  r2Folder,
  r2PublicUrl,
  slugifyFileName,
} from './r2.util';

/** Video > 50MB bị từ chối — FE tự nén về ≤ 50MB trước khi xin link upload. */
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024;
const VIDEO_PRESIGN_EXPIRES_SECONDS = 3600;

const VIDEO_EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
};

type VideoPresignInput = {
  fileName?: unknown;
  contentType?: unknown;
  size?: unknown;
};

type VideoCompleteInput = {
  objectKey?: unknown;
  fileName?: unknown;
  contentType?: unknown;
  size?: unknown;
};

@Injectable()
export class VideosService {
  private get videoPrefix(): string {
    return `${r2Folder()}/videos/`;
  }

  async presign(input: VideoPresignInput) {
    const contentType =
      typeof input.contentType === 'string' ? input.contentType : '';
    const extension = VIDEO_EXTENSION_BY_CONTENT_TYPE[contentType];

    if (!extension) {
      throw new BadRequestException({
        code: 'VIDEO_UPLOAD_INVALID_TYPE',
        message: 'Chỉ hỗ trợ video MP4 hoặc MOV.',
      });
    }

    const size = typeof input.size === 'number' ? input.size : NaN;
    if (!Number.isFinite(size) || size <= 0) {
      throw new BadRequestException({
        code: 'VIDEO_UPLOAD_PRESIGN_FAILED',
        message: 'Thiếu dung lượng (size) của video.',
      });
    }

    if (size > VIDEO_MAX_BYTES) {
      throw new BadRequestException({
        code: 'VIDEO_UPLOAD_FILE_TOO_LARGE',
        message: 'Video vượt quá giới hạn 50MB.',
      });
    }

    const fileName =
      typeof input.fileName === 'string' && input.fileName.trim()
        ? input.fileName.trim()
        : `video.${extension}`;

    const objectKey = `${this.videoPrefix}${Date.now()}-${randomBytes(4).toString('hex')}-${slugifyFileName(fileName, 'video')}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: r2Bucket(),
      Key: objectKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(getR2Client(), command, {
      expiresIn: VIDEO_PRESIGN_EXPIRES_SECONDS,
    });

    return {
      uploadUrl,
      publicUrl: r2PublicUrl(objectKey),
      objectKey,
      expiresAt: new Date(
        Date.now() + VIDEO_PRESIGN_EXPIRES_SECONDS * 1000,
      ).toISOString(),
      headers: { 'Content-Type': contentType },
    };
  }

  async complete(input: VideoCompleteInput) {
    const objectKey = typeof input.objectKey === 'string' ? input.objectKey : '';

    if (
      !objectKey ||
      !objectKey.startsWith(this.videoPrefix) ||
      objectKey.includes('..')
    ) {
      throw new BadRequestException({
        code: 'VIDEO_UPLOAD_INVALID_OBJECT_KEY',
        message: 'Khóa upload video không hợp lệ.',
      });
    }

    const client = getR2Client();
    const bucket = r2Bucket();

    let actualSize: number;
    try {
      const head = await client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: objectKey }),
      );
      actualSize = head.ContentLength ?? 0;
    } catch {
      throw new NotFoundException({
        code: 'VIDEO_UPLOAD_OBJECT_NOT_FOUND',
        message: 'Không tìm thấy file video trên storage.',
      });
    }

    if (actualSize > VIDEO_MAX_BYTES) {
      await client
        .send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }))
        .catch(() => undefined);

      throw new BadRequestException({
        code: 'VIDEO_UPLOAD_FILE_TOO_LARGE',
        message: 'Video vượt quá giới hạn 50MB.',
      });
    }

    const reportedSize = typeof input.size === 'number' ? input.size : null;
    if (reportedSize !== null && reportedSize !== actualSize) {
      await client
        .send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }))
        .catch(() => undefined);

      throw new BadRequestException({
        code: 'VIDEO_UPLOAD_COMPLETE_MISMATCH',
        message: 'Dung lượng file trên storage không khớp với file đã gửi.',
      });
    }

    const baseName = objectKey.slice(this.videoPrefix.length);
    const originalName =
      typeof input.fileName === 'string' && input.fileName.trim()
        ? input.fileName.trim()
        : baseName;

    return {
      url: r2PublicUrl(objectKey),
      filename: baseName,
      originalName,
      size: actualSize,
      objectKey,
    };
  }
}
