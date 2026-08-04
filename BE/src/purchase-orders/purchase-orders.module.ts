import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import {
  PurchaseOrder,
  PurchaseOrderSchema,
} from './schemas/purchase-order.schema';
import { ProductsModule } from 'src/products/products.module';
import { ProductOptionValueService } from 'src/products/option-value.service';
import { Product, ProductSchema } from 'src/products/schemas/product.schema';
import { OptionValue, OptionValueSchema } from 'src/products/schemas/option-value.schema';
import { ReportingModule } from 'src/reporting/reporting.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PurchaseOrder.name, schema: PurchaseOrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: OptionValue.name, schema: OptionValueSchema },
    ]),
    ProductsModule,
    ReportingModule,
  ],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService, ProductOptionValueService],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
