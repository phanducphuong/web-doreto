import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PurchaseOrderStatus } from 'src/common/enums/purchase-order.enum';
import { Address, AddressSchema } from 'src/users/schemas/user.schema';
import { NonLoginUser, NonLoginUserSchema } from './non-login-user.schema';
import { PurchaseItem, PurchaseItemSchema } from './purchase-item.schema';
import {
  PurchasePriceDetail,
  PurchasePriceDetailSchema,
} from './purchase-price-detail.schema';

@Schema({ timestamps: true })
export class PurchaseOrder {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  userId?: string;

  @Prop({ type: [PurchaseItemSchema], required: true })
  purchaseItems: PurchaseItem[];

  @Prop({ type: NonLoginUserSchema, required: false })
  nonLoginUser?: NonLoginUser;

  @Prop({ type: AddressSchema, required: false })
  address?: Address;

  @Prop({ default: PurchaseOrderStatus.PENDING })
  status: PurchaseOrderStatus; // Có thể thêm enum sau

  @Prop({ type: PurchasePriceDetailSchema })
  purchasePriceDetail: PurchasePriceDetail;

  @Prop()
  deliveriedAt?: Date;

  @Prop({ default: false })
  isFeedbacked: boolean;
}

export type PurchaseOrderDocument = HydratedDocument<PurchaseOrder>;

export const PurchaseOrderSchema = SchemaFactory.createForClass(PurchaseOrder);

PurchaseOrderSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

PurchaseItemSchema.set('toJSON', { virtuals: true });
PurchaseItemSchema.set('toObject', { virtuals: true });

PurchaseOrderSchema.pre('save', function (next) {
  // init nếu chưa có
  if (!this.purchasePriceDetail) {
    this.purchasePriceDetail = {
      summaryPrice: 0,
    };
  }

  // 1. tính subtotal
  const summaryPrice = this.purchaseItems.reduce(
    (acc, item) => acc + item.price * item.count,
    0,
  );

  // 3. set lại toàn bộ (tránh dữ liệu rác)
  this.purchasePriceDetail = {
    summaryPrice,
  };
});
