import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsNumber, Min } from 'class-validator';
import { Types } from 'mongoose';

@Schema()
export class PurchasePriceDetail {
  @Prop({ required: true })
  @IsNumber()
  @Min(0)
  summaryPrice: number;
}

export const PurchasePriceDetailSchema =
  SchemaFactory.createForClass(PurchasePriceDetail);
