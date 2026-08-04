import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class ProductDailyReport {
  @Prop({ required: true, index: true })
  date: string;

  @Prop({ required: true, index: true })
  productId: number;

  @Prop({ default: 0 })
  soldQty: number;

  @Prop({ default: 0 })
  revenue: number;

  @Prop({ default: 0 })
  orderCount: number;
}

export type ProductDailyReportDocument = HydratedDocument<ProductDailyReport>;

export const ProductDailyReportSchema =
  SchemaFactory.createForClass(ProductDailyReport);

ProductDailyReportSchema.index({ date: 1, productId: 1 }, { unique: true });
