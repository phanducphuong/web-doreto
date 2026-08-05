import { Module } from '@nestjs/common';
import { ImageFramesService } from './image-frames.service';
import { ImageFramesController } from './image-frames.controller';

@Module({
  controllers: [ImageFramesController],
  providers: [ImageFramesService],
  exports: [ImageFramesService],
})
export class ImageFramesModule {}
