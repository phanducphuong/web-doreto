import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PurchaseOrder,
  PurchaseOrderSchema,
} from 'src/purchase-orders/schemas/purchase-order.schema';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import {
  OrderDailyReport,
  OrderDailyReportSchema,
} from './schemas/order-daily-report.schema';
import {
  ProductDailyReport,
  ProductDailyReportSchema,
} from './schemas/product-daily-report.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PurchaseOrder.name, schema: PurchaseOrderSchema },
      { name: OrderDailyReport.name, schema: OrderDailyReportSchema },
      { name: ProductDailyReport.name, schema: ProductDailyReportSchema },
    ]),
  ],
  controllers: [ReportingController],
  providers: [ReportingService],
  exports: [ReportingService],
})
export class ReportingModule {}
