import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

export type OptionValueDocument = HydratedDocument<OptionValue>;

@Schema({ timestamps: true })
export class OptionValue {
  @Prop({ required: false })
  imageUrl?: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ min: 0 })
  originalPrice?: number;

  @Prop({ default: 0 })
  purchaseCount?: number;

  @Prop({ type: [String], default: [] })
  productOptionNames?: string[];

  @Prop({ default: 0, min: 0 })
  stock?: number;
}

export const OptionValueSchema = SchemaFactory.createForClass(OptionValue);
