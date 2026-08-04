import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  private async checkDuplicateName(name: string, excludeId?: string) {
    const existing = await this.prisma.tag.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) {
      throw new ConflictException(`Tag with name "${name}" already exists`);
    }
  }

  async create(dto: CreateTagDto) {
    await this.checkDuplicateName(dto.name);
    return this.prisma.tag.create({ data: { ...dto } });
  }

  async findAllActive() {
    return this.prisma.tag.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(id: string) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      throw new NotFoundException('Not found');
    }
    return tag;
  }

  async update(id: string, dto: UpdateTagDto) {
    if (dto.name) {
      await this.checkDuplicateName(dto.name, id);
    }
    try {
      return await this.prisma.tag.update({
        where: { id },
        data: { ...dto },
      });
    } catch {
      throw new NotFoundException('Not found');
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.tag.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Not found');
    }
  }
}
