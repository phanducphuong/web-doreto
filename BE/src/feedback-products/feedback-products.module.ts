import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedbackProductsService } from './feedback-products.service';
import { FeedbackProductsController } from './feedback-products.controller';
import {
  FeedbackProduct,
  FeedbackProductSchema,
} from './schemas/feedback-product.schema';
import { CounterModule } from 'src/counter/counter.module';
import { Product, ProductSchema } from 'src/products/schemas/product.schema';
import {
  PurchaseOrder,
  PurchaseOrderSchema,
} from 'src/purchase-orders/schemas/purchase-order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FeedbackProduct.name, schema: FeedbackProductSchema },
      { name: Product.name, schema: ProductSchema },
      { name: PurchaseOrder.name, schema: PurchaseOrderSchema },
    ]),
    CounterModule,
  ],
  controllers: [FeedbackProductsController],
  providers: [FeedbackProductsService],
  exports: [FeedbackProductsService],
})
export class FeedbackProductsModule {}
