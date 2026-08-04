import { Injectable, ConflictException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { Model } from 'mongoose';
import { BaseService } from 'src/common/base/base.service';
import { Product, ProductDocument } from 'src/products/schemas/product.schema';

@Injectable()
export class CategoriesService extends BaseService<CategoryDocument> {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {
    super(categoryModel);
  }

  private async checkDuplicateName(name: string, excludeId?: number) {
    const query: any = {
      name: { $regex: `^${name}$`, $options: 'i' },
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existingCategory = await this.categoryModel.findOne(query);

    if (existingCategory) {
      throw new ConflictException(
        `Category with name "${name}" already exists`,
      );
    }
  }

  async create(createCategoryDto: CreateCategoryDto) {
    await this.checkDuplicateName(createCategoryDto.name);

    return super.create(createCategoryDto);
  }

  async update<CategoryDocument>(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    if (updateCategoryDto.name) {
      await this.checkDuplicateName(updateCategoryDto.name, id);
    }

    return super.update<CategoryDocument>(id, updateCategoryDto);
  }

  async getTopCategories() {
    return this.categoryModel
      .find({ parentId: null })
      .sort({ order: 1 })
      .populate('parentId', 'name')
      .exec();
  }

  async getProductCountByCategory() {
    const [categories, counts] = await Promise.all([
      this.categoryModel.find({}, { _id: 1 }).lean(),
      this.productModel.aggregate<{ _id: number; count: number }>([
        { $unwind: '$categoryIds' },
        {
          $group: {
            _id: '$categoryIds',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const countMap = new Map<number, number>(
      counts.map((item) => [item._id, item.count]),
    );

    return categories.reduce(
      (acc, category) => {
        acc[category._id] = countMap.get(category._id) ?? 0;
        return acc;
      },
      {} as Record<number, number>,
    );
  }
}
