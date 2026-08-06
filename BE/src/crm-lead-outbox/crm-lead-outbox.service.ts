import { Injectable, Logger } from '@nestjs/common';
import { DecorLeadOutbox, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CrmWebhookClient } from './crm-webhook.client';
import {
  OUTBOX_BATCH_SIZE,
  OUTBOX_MAX_ATTEMPTS,
  OutboxSourceKind,
} from './crm-lead-outbox.constants';

// Input enqueue — payload khớp CreateDecorLeadDto (plan 02), service không tự dựng.
export interface EnqueueLeadInput {
  sourceKind: OutboxSourceKind; // 'order' | 'contact'
  sourceId: string; // id đơn/liên hệ decor
  payload: Prisma.InputJsonValue; // body sẽ POST sang CRM
}

/**
 * Outbox service (D-04): enqueue ghi row TRONG tx của caller (at-least-once),
 * flushPending/flushOne gửi row tới hạn với backoff + giới hạn retry.
 * Mọi lỗi gửi nuốt + log sourceKind:sourceId + status — KHÔNG log PII payload,
 * KHÔNG throw ra luồng tạo đơn (T-38-11/12).
 */
@Injectable()
export class CrmLeadOutboxService {
  private readonly logger = new Logger(CrmLeadOutboxService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly client: CrmWebhookClient,
  ) {}

  /**
   * Ghi outbox row CÙNG transaction của caller (plan 04 truyền tx đơn/liên hệ vào).
   * upsert theo khóa kép (sourceKind, sourceId) = idempotent: POST rồi PATCH cùng
   * đơn chỉ 1 row (D-08). KHÔNG mở tx mới, KHÔNG gọi CRM ở đây (giữ tx ngắn).
   */
  async enqueue(
    tx: Prisma.TransactionClient,
    input: EnqueueLeadInput,
  ): Promise<void> {
    await tx.decorLeadOutbox.upsert({
      where: {
        sourceKind_sourceId: {
          sourceKind: input.sourceKind,
          sourceId: input.sourceId,
        },
      },
      // Row đã có (retry/PATCH) → không tạo trùng; giữ nguyên trạng thái đang gửi
      update: {},
      create: {
        sourceKind: input.sourceKind,
        sourceId: input.sourceId,
        payload: input.payload,
        status: 'pending',
        nextAttemptAt: new Date(),
      },
    });
  }

  /**
   * Gửi 1 row: ok → mark 'sent'; lỗi → tăng attempts + backoff mũ,
   * đạt OUTBOX_MAX_ATTEMPTS → mark 'failed'. Nuốt mọi lỗi (log không PII).
   */
  async flushOne(row: DecorLeadOutbox): Promise<void> {
    try {
      const result = await this.client.post(row.payload);

      if (result.ok) {
        await this.prisma.decorLeadOutbox.update({
          where: { id: row.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
            attempts: { increment: 1 },
            lastError: null,
          },
        });
        this.logger.log(
          `Gửi lead ok ${row.sourceKind}:${row.sourceId} (status ${result.status})`,
        );
        return;
      }

      const attempts = row.attempts + 1;
      const failed = attempts >= OUTBOX_MAX_ATTEMPTS;
      await this.prisma.decorLeadOutbox.update({
        where: { id: row.id },
        data: {
          attempts,
          status: failed ? 'failed' : 'pending',
          lastError: (result.error ?? `status ${result.status}`).slice(0, 500),
          nextAttemptAt: this.computeNextAttemptAt(attempts),
        },
      });
      this.logger.warn(
        `Gửi lead lỗi ${row.sourceKind}:${row.sourceId} attempts=${attempts} status=${
          failed ? 'failed' : 'pending'
        }`,
      );
    } catch (error) {
      // Không được để flushOne văng lỗi ra flushPending/worker
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `flushOne ngoại lệ ${row.sourceKind}:${row.sourceId}: ${message}`,
      );
    }
  }

  /**
   * Quét row pending tới hạn (nextAttemptAt <= now), gửi tuần tự.
   * Toàn hàm bọc try/catch — worker KHÔNG được chết.
   */
  async flushPending(): Promise<void> {
    try {
      const rows = await this.prisma.decorLeadOutbox.findMany({
        where: { status: 'pending', nextAttemptAt: { lte: new Date() } },
        orderBy: { nextAttemptAt: 'asc' },
        take: OUTBOX_BATCH_SIZE,
      });
      for (const row of rows) {
        await this.flushOne(row);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`flushPending ngoại lệ: ${message}`);
    }
  }

  /**
   * Backoff mũ có trần: 2^attempts giây, tối đa 3600s (1 giờ).
   */
  private computeNextAttemptAt(attempts: number): Date {
    const delaySec = Math.min(Math.pow(2, attempts), 3600);
    return new Date(Date.now() + delaySec * 1000);
  }
}
