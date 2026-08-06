import { Module } from '@nestjs/common';
import { CrmWebhookClient } from './crm-webhook.client';
import { CrmLeadOutboxService } from './crm-lead-outbox.service';
import { CrmLeadOutboxWorker } from './crm-lead-outbox.worker';

/**
 * Module outbox bắn lead sang CRM (phase 38).
 * PrismaModule là @Global nên không cần import lại.
 * Export Service + Worker để plan 04 inject vào purchase-orders + contact-requests
 * (enqueue in-tx + triggerFlushSoon sau commit).
 */
@Module({
  providers: [CrmWebhookClient, CrmLeadOutboxService, CrmLeadOutboxWorker],
  exports: [CrmLeadOutboxService, CrmLeadOutboxWorker],
})
export class CrmLeadOutboxModule {}
