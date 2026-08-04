import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter } from './schemas/counter.schema';

@Injectable()
export class CounterService {
  constructor(
    @InjectModel(Counter.name) private readonly counterModel: Model<Counter>,
  ) {}

  async getNextSequence(
    modelName: string,
    count: number = 1,
  ): Promise<number[]> {
    const counter = await this.counterModel.findOneAndUpdate(
      { _id: modelName },
      { $inc: { seq: count } },
      { upsert: true, returnDocument: 'after' },
    );

    const start = counter.seq - count + 1;
    return Array.from({ length: count }, (_, i) => start + i);
  }

  async getNextOne(modelName: string): Promise<number> {
    const currentId = await this.counterModel.findById(modelName);
    return (currentId?.seq || 0) + 1;
  }

  async inc(modelName: string, count: number) {
    return this.counterModel.findOneAndUpdate(
      { _id: modelName },
      { $inc: { seq: count } },
      { upsert: true, returnDocument: 'after' },
    );
  }
}
