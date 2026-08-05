import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Body,
  Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { File } from 'multer';
import { UploadsService } from './uploads.service';
import { VideosService } from './videos.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

/** Chặn file quá khổ ngay ở multer (Cloud Run cũng chỉ nhận request ≤ 32MB). */
const UPLOAD_MAX_FILES = 20;
const UPLOAD_MAX_FILE_BYTES = 25 * 1024 * 1024;

// Ảnh: cần đăng nhập (khách viết đánh giá có ảnh + admin);
// video mô tả sản phẩm: chỉ admin dùng
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly videosService: VideosService,
  ) {}

  @Post('files')
  @UseInterceptors(
    FilesInterceptor('files', UPLOAD_MAX_FILES, {
      limits: { fileSize: UPLOAD_MAX_FILE_BYTES },
    }),
  )
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

  @Roles(Role.ADMIN)
  @Post('videos/presign')
  async presignVideo(@Body() body: Record<string, unknown>) {
    const data = await this.videosService.presign(body ?? {});
    return { success: true, data };
  }

  @Roles(Role.ADMIN)
  @Post('videos/complete')
  async completeVideo(@Body() body: Record<string, unknown>) {
    const data = await this.videosService.complete(body ?? {});
    return { success: true, data };
  }
}
