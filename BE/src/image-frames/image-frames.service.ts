import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateImageFrameDto } from './dto/create-image-frame.dto';
import { UpdateImageFrameDto } from './dto/update-image-frame.dto';

@Injectable()
export class ImageFramesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateImageFrameDto) {
    return this.prisma.imageFrame.create({ data: { ...dto } });
  }

  findAll() {
    return this.prisma.imageFrame.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  findAllActive() {
    return this.prisma.imageFrame.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        imageUrl: true,
        insetTop: true,
        insetRight: true,
        insetBottom: true,
        insetLeft: true,
        sortOrder: true,
      },
    });
  }

  async findOne(id: string) {
    const frame = await this.prisma.imageFrame.findUnique({ where: { id } });
    if (!frame) {
      throw new NotFoundException('Not found');
    }
    return frame;
  }

  // Lỗi Prisma (P2025/P2023 → 404) do PrismaExceptionFilter toàn cục ánh xạ
  async update(id: string, dto: UpdateImageFrameDto) {
    return this.prisma.imageFrame.update({
      where: { id },
      data: { ...dto },
    });
  }

  // Xóa mềm: chỉ vô hiệu hóa để sản phẩm cũ đang gắn khung không mất tham chiếu
  async remove(id: string) {
    return this.prisma.imageFrame.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
