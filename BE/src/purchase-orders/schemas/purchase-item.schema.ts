import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema()
export class PurchaseItem {
  @Prop({ type: Object })
  productOptionValue?: Record<string, unknown>;

  @Prop({ required: true, type: Types.ObjectId, ref: 'OptionValue' })
  productOptionValueId: Types.ObjectId;

  @Prop({ type: Object })
  product?: Record<string, unknown>;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Product' })
  productId: Types.ObjectId;

  @Prop({ required: true, type: Number, min: 1 })
  count: number;

  @Prop({ required: true })
  price: number;
}

export const PurchaseItemSchema = SchemaFactory.createForClass(PurchaseItem);
