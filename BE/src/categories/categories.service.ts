import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private async checkDuplicateName(name: string, excludeId?: string) {
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });

    if (existingCategory) {
      throw new ConflictException(
        `Category with name "${name}" already exists`,
      );
    }
  }

  async create(createCategoryDto: CreateCategoryDto) {
    await this.checkDuplicateName(createCategoryDto.name);
    return this.prisma.category.create({ data: { ...createCategoryDto } });
  }

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Not found');
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    if (updateCategoryDto.name) {
      await this.checkDuplicateName(updateCategoryDto.name, id);
    }

    // Lỗi Prisma do PrismaExceptionFilter toàn cục ánh xạ (P2025/P2023 → 404,
    // P2003 → 409) — không catch trần để khỏi nuốt lỗi thật
    return this.prisma.category.update({
      where: { id },
      data: { ...updateCategoryDto },
    });
  }

  async remove(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }

  async getTopCategories() {
    return this.prisma.category.findMany({
      where: { parentId: null },
      orderBy: { order: 'asc' },
    });
  }

  /** Đếm số sản phẩm theo từng danh mục (dùng bảng nối product_categories). */
  async getProductCountByCategory(): Promise<Record<string, number>> {
    const [categories, grouped] = await Promise.all([
      this.prisma.category.findMany({ select: { id: true } }),
      this.prisma.productCategory.groupBy({
        by: ['categoryId'],
        _count: { _all: true },
      }),
    ]);

    const countMap = new Map<string, number>(
      grouped.map((item) => [item.categoryId, item._count._all]),
    );

    return categories.reduce(
      (acc, category) => {
        acc[category.id] = countMap.get(category.id) ?? 0;
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}
