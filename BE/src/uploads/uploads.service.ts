/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import { File } from 'multer';

type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  bytes: number;
  format?: string;
};

@Injectable()
export class UploadsService {
  constructor() {
    this.configureCloudinary();
  }

  private configureCloudinary() {
    if (process.env.CLOUDINARY_URL) {
      cloudinary.config(process.env.CLOUDINARY_URL);
      return;
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.API_KEY;
    const apiSecret = process.env.API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn(
        'Warning: Missing Cloudinary config. Uploads to Cloudinary will fail until CLOUDINARY_URL or (CLOUDINARY_CLOUD_NAME + API_KEY + API_SECRET) is provided.',
      );
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  private async uploadToCloudinary(
    fileBuffer: Buffer,
    originalName: string,
    isImage: boolean,
  ): Promise<CloudinaryUploadResult> {
    const folder = process.env.CLOUDINARY_FOLDER || 'doreto-web';
    const resourceType: 'image' | 'auto' = isImage ? 'image' : 'auto';

    return new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
          filename_override: originalName || `${Date.now()}-upload`,
        },
        (error, result) => {
          if (error || !result) {
            reject(new Error(error?.message || 'Cloudinary upload failed'));
            return;
          }

          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            bytes: result.bytes,
            format: result.format,
          });
        },
      );

      stream.end(fileBuffer);
    });
  }

  async saveFile(file: File): Promise<CloudinaryUploadResult> {
    const isImage = file.mimetype.startsWith('image/');
    return this.uploadToCloudinary(
      file.buffer as Buffer,
      file.originalname,
      isImage,
    );
  }

  async saveFileWithCompression(file: File, maxSize = 128) {
    const isImage = file.mimetype.startsWith('image/');

    if (isImage) {
      const compressedBuffer = await sharp(file.buffer as Buffer)
        .resize(maxSize, maxSize, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();

      const compressedName = `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}.webp`;
      return this.uploadToCloudinary(compressedBuffer, compressedName, true);
    } else {
      return this.uploadToCloudinary(
        file.buffer as Buffer,
        file.originalname,
        false,
      );
    }
  }
}
