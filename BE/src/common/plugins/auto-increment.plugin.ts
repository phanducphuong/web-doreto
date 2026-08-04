// src/common/plugins/auto-increment.plugin.ts
import { Schema } from 'mongoose';
import mongoose from 'mongoose';
import { Counter, CounterSchema } from 'src/counter/schemas/counter.schema';

export function createAutoIncrementPlugin(connection: mongoose.Connection) {
  return function autoIncrementPlugin(
    schema: Schema,
    options: { modelName: string; field?: string },
  ) {
    const { modelName, field = 'sequence' } = options;

    console.log(modelName, 'modelName');

    schema.pre('save', async function () {
      const doc = this as any;
      if (doc.isNew && doc[field] == null) {
        const CounterModel =
          connection.models.Counter ||
          connection.model<Counter>('Counter', CounterSchema);
        const counter = await CounterModel.findByIdAndUpdate(
          modelName,
          { $inc: { seq: 1 } },
          { new: true, upsert: true },
        );
        doc[field] = counter.seq;
      }
    });
  };
}
