import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tag, TagDocument } from './schemas/tag.schema';
import { BaseService } from 'src/common/base/base.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService extends BaseService<TagDocument> {
  constructor(
    @InjectModel(Tag.name)
    private readonly tagModel: Model<TagDocument>,
  ) {
    super(tagModel);
  }

  private async checkDuplicateName(name: string, excludeId?: number) {
    const query: any = {
      name: { $regex: `^${name}$`, $options: 'i' },
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await this.tagModel.findOne(query);
    if (existing) {
      throw new ConflictException(`Tag with name "${name}" already exists`);
    }
  }

  async create(dto: CreateTagDto) {
    await this.checkDuplicateName(dto.name);
    return super.create(dto);
  }

  async findAllActive() {
    return this.tagModel.find({ isActive: true }).sort({ order: 1 }).exec();
  }

  async update<Y = TagDocument>(id: number, dto: UpdateTagDto) {
    if (dto.name) {
      await this.checkDuplicateName(dto.name, id);
    }
    return super.update<Y>(id, dto);
  }
}
