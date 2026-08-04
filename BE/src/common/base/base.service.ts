import { NotFoundException } from '@nestjs/common';
import { MongooseBulkWriteResult } from 'mongoose';
import {
  Model,
  Document,
  UpdateQuery,
  QueryFilter,
  QueryOptions,
  Query,
  AnyBulkWriteOperation,
} from 'mongoose';

export abstract class BaseService<T extends Document<any, any, any>> {
  constructor(protected readonly model: Model<T>) {}

  async create(dto: any): Promise<T> {
    const item = new this.model(dto);
    return item.save();
  }

  async findAll(): Promise<T[]> {
    return this.model.find().exec();
  }

  async query(
    filter: QueryFilter<T> = {},
    options?: QueryOptions<T>,
    populate?: string | string[],
  ) {
    const total = await this.model.countDocuments(filter);

    let query = this.model.find(filter);

    if (populate) {
      query = query.populate(populate);
    }

    // 👉 apply buildQuery ở đây
    query = this.buildQuery(query, options);

    const data = await query.exec();

    return {
      data,
      total,
      page: options?.page ?? 1,
      count: options?.limit ?? 10,
    };
  }

  async findOne(id: string | number): Promise<T | null> {
    const base = await this.model.findById(id).exec();

    if (!base) {
      throw new NotFoundException('Not found');
    }

    return base;
  }

  async update<Y = T>(id: string | number, dto: UpdateQuery<T>): Promise<Y> {
    const base = await this.model
      .findByIdAndUpdate(id, dto, { returnDocument: 'after' })
      .exec();

    if (!base) {
      throw new NotFoundException('Not found');
    }

    return base as Y;
  }

  async upsert(filter: QueryFilter<T>, dto: UpdateQuery<T>): Promise<T> {
    const result = await this.model
      .findOneAndUpdate(filter, dto, {
        upsert: true,
        new: true, // Trả về document sau khi đã update/tạo mới
        setDefaultsOnInsert: true, // Áp dụng các default value trong Schema nếu tạo mới
      })
      .exec();

    return result as T;
  }

  async upsertMany(
    dto: UpdateQuery<T>[],
    identityKey: keyof T = '_id' as keyof T,
  ): Promise<MongooseBulkWriteResult> {
    if (!dto.length) {
      return {} as MongooseBulkWriteResult;
    }

    const operations = dto.map((item) => {
      const filter = { [identityKey]: (item as any)[identityKey] };
      const update = { ...item };
      delete (update as any)[identityKey];

      return {
        updateOne: {
          filter: filter as any,
          update: { $set: update } as any,
          upsert: true,
        },
      };
    });

    return await this.model.bulkWrite(operations);
  }

  async remove(id: string | number): Promise<T | null> {
    const base = await this.model.findByIdAndDelete(id).exec();

    if (!base) {
      throw new NotFoundException('Not found');
    }

    return base;
  }
  async deleteMany(filter: QueryFilter<T>): Promise<{ deletedCount?: number }> {
    return this.model.deleteMany(filter).exec();
  }

  protected buildQuery<Q extends Query<any, any>>(
    query: Q,
    options?: QueryOptions<T>,
  ): Q {
    if (!options) return query;

    const { sortBy, sortOrder, page = 1, limit = 10 } = options;

    // sort
    if (sortBy) {
      query = query.sort({
        [sortBy as string]: sortOrder === 'desc' ? -1 : 1,
      });
    }

    // pagination
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);

    return query;
  }
}
