import { Module } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { ReportingModule } from 'src/reporting/reporting.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [ReportingModule, AuthModule],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
