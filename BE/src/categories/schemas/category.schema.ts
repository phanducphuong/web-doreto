import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
  @Prop({ type: Number })
  _id?: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  slug: string;

  @Prop({ type: Number, ref: Category.name, default: null })
  parentId: number;

  @Prop({ type: Number, default: 0, min: 0, max: 5 })
  order?: number;

  @Prop({ type: String })
  icon?: string;

  @Prop({ default: '' })
  description?: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.set('_id', true);
