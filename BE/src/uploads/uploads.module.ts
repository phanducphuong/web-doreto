import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { VideosService } from './videos.service';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService, VideosService],
  exports: [UploadsService, VideosService],
})
export class UploadsModule {}
