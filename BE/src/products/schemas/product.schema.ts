import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { normalizeText } from 'src/common/utils';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true, _id: true })
export class Product {
  @Prop({ type: Number })
  _id?: number;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({
    type: [Number],
    ref: 'Category',
    default: [],
  })
  categoryIds?: number[];

  @Prop({
    type: [Number],
    ref: 'Tag',
    default: [],
  })
  tagIds?: number[];

  @Prop({
    type: [String],
    default: [],
  })
  productOptions: string[];

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'OptionValue' }],
    default: [],
  })
  optionValueIds: Types.ObjectId[];

  @Prop({ index: true })
  normalizedName: string;

  @Prop({ min: 0 })
  minPrice: number;

  @Prop({ min: 0 })
  maxPrice: number;

  @Prop({ default: 0 })
  purchaseCount: number;

  @Prop({ default: 0, min: 0, max: 5 })
  averageRating: number;

  @Prop({ default: 0, min: 0 })
  ratingCount: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: [], type: [String] })
  imageUrls: string[];

  @Prop({ default: [], type: [String] })
  thumbnailUrls: string[];

  @Prop({ default: 0 })
  stock: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.set('_id', true);

ProductSchema.virtual('optionValues', {
  ref: 'OptionValue',
  localField: 'optionValueIds',
  foreignField: '_id',
});

ProductSchema.virtual('categories', {
  ref: 'Category',
  localField: 'categoryIds',
  foreignField: '_id',
});

ProductSchema.virtual('tags', {
  ref: 'Tag',
  localField: 'tagIds',
  foreignField: '_id',
});

ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

ProductSchema.pre('save', function (this: ProductDocument) {
  if (this.isModified('name')) {
    this.normalizedName = normalizeText(this.name);
  }
});
