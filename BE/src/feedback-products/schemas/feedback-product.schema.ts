import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FeedbackProductDocument = HydratedDocument<FeedbackProduct>;

@Schema({ timestamps: true, _id: true })
export class FeedbackProduct {
  @Prop()
  comment?: string;

  @Prop({ type: [String] })
  images?: string[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PurchaseOrder', required: true })
  purchaseOrderId!: Types.ObjectId;

  @Prop({ min: 1, max: 5 })
  score?: number;

  @Prop()
  adminReply?: string;

  @Prop({ type: [String] })
  replyImages?: string[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  repliedBy?: Types.ObjectId;

  @Prop()
  repliedAt?: Date;

  @Prop({ default: true })
  isActive!: boolean;
}

export const FeedbackProductSchema =
  SchemaFactory.createForClass(FeedbackProduct);

FeedbackProductSchema.index({
  purchaseOrderId: 1,
  isActive: 1,
  createdAt: -1,
});
FeedbackProductSchema.index(
  { userId: 1, purchaseOrderId: 1 },
  { unique: true },
);
