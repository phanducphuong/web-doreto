import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class OrderDailyReport {
  @Prop({ required: true, unique: true, index: true })
  date: string;

  @Prop({ default: 0 })
  pendingCount: number;

  @Prop({ default: 0 })
  confirmedCount: number;

  @Prop({ default: 0 })
  shippedCount: number;

  @Prop({ default: 0 })
  deliveredCount: number;

  @Prop({ default: 0 })
  cancelledCount: number;

  @Prop({ default: 0 })
  orderCount: number;

  @Prop({ default: 0 })
  grossRevenue: number;

  @Prop({ default: 0 })
  averageOrderValue: number;
}

export type OrderDailyReportDocument = HydratedDocument<OrderDailyReport>;

export const OrderDailyReportSchema =
  SchemaFactory.createForClass(OrderDailyReport);
