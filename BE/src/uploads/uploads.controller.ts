import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { File } from 'multer';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('files')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFile(@UploadedFiles() files: File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const uploadedFiles = await Promise.all(
      files.map((file) => this.uploadsService.saveFile(file)),
    );

    const data = uploadedFiles.map((uploaded, index) => ({
      filename: uploaded.public_id,
      url: uploaded.secure_url,
      originalName: files[index].originalname,
      size: uploaded.bytes,
    }));

    return {
      success: true,
      data,
    };
  }

  @Post('compress')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFilesWithCompression(
    @UploadedFiles() files: File[],
    @Query('size') size?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const maxSize = size ? parseInt(size, 10) : 128;

    if (isNaN(maxSize) || maxSize < 1) {
      throw new BadRequestException('Size must be a positive number');
    }

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const uploaded = await this.uploadsService.saveFileWithCompression(
          file,
          maxSize,
        );

        return {
          filename: uploaded.public_id,
          url: uploaded.secure_url,
          originalName: file.originalname,
          originalSize: file.size,
          uploadedSize: uploaded.bytes,
          compressionSize: maxSize,
        };
      }),
    );

    return {
      message: 'Files compressed and uploaded successfully',
      compressionSize: maxSize,
      count: uploadedFiles.length,
      files: uploadedFiles,
    };
  }
}
