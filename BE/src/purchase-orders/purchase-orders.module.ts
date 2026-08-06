import { Module } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { ReportingModule } from 'src/reporting/reporting.module';
import { AuthModule } from 'src/auth/auth.module';
import { CrmLeadOutboxModule } from 'src/crm-lead-outbox/crm-lead-outbox.module';

@Module({
  imports: [ReportingModule, AuthModule, CrmLeadOutboxModule],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
