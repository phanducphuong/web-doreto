import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ImageFramesService } from './image-frames.service';
import { CreateImageFrameDto } from './dto/create-image-frame.dto';
import { UpdateImageFrameDto } from './dto/update-image-frame.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { Public } from 'src/common/decorators/public.decorator';

@UseGuards(JwtAuthGuard)
@Controller('image-frames')
export class ImageFramesController {
  constructor(private readonly imageFramesService: ImageFramesService) {}

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateImageFrameDto) {
    return this.imageFramesService.create(dto);
  }

  @Public()
  @Get('active')
  findAllActive() {
    return this.imageFramesService.findAllActive();
  }

  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.imageFramesService.findAll();
  }

  @Roles(Role.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.imageFramesService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateImageFrameDto) {
    return this.imageFramesService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.imageFramesService.remove(id);
  }
}
