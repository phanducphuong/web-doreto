import { Module } from '@nestjs/common';
import { ContactRequestsService } from './contact-requests.service';
import { ContactRequestsController } from './contact-requests.controller';
import { AuthModule } from 'src/auth/auth.module';
import { CrmLeadOutboxModule } from 'src/crm-lead-outbox/crm-lead-outbox.module';

@Module({
  imports: [AuthModule, CrmLeadOutboxModule],
  controllers: [ContactRequestsController],
  providers: [ContactRequestsService],
})
export class ContactRequestsModule {}
