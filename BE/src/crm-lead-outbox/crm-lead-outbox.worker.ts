import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { CrmLeadOutboxService } from './crm-lead-outbox.service';
import { OUTBOX_FLUSH_INTERVAL_MS } from './crm-lead-outbox.constants';

/**
 * Worker nền quét outbox gửi lead pending (D-04).
 * - Lịch bằng timer built-in của Node trong OnModuleInit/OnModuleDestroy (không thêm package).
 * - Cờ `running` chống chạy chồng (T-38-12).
 * - Hàm bắn-ngay: plan 04 gọi sau khi commit đơn/liên hệ để gửi gần-tức-thì;
 *   worker nền ~30s đảm bảo gửi cuối cùng kể cả khi CRM tạm chết.
 */
@Injectable()
export class CrmLeadOutboxWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CrmLeadOutboxWorker.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(private readonly outbox: CrmLeadOutboxService) {}

  onModuleInit(): void {
    this.timer = setInterval(
      () => void this.tick(),
      OUTBOX_FLUSH_INTERVAL_MS,
    );
    // Không giữ event loop sống chỉ vì timer (cho phép process thoát sạch)
    this.timer.unref?.();
    this.logger.log(
      `outbox worker started (mỗi ${OUTBOX_FLUSH_INTERVAL_MS}ms)`,
    );
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  // Cờ chống chạy chồng — lượt trước chưa xong thì bỏ lượt này
  private async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      await this.outbox.flushPending();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`outbox tick lỗi: ${message}`);
    } finally {
      this.running = false;
    }
  }

  /**
   * Bắn gần-tức-thì sau enqueue (D-04) — non-blocking, đã nuốt mọi lỗi bên trong.
   * KHÔNG await ở caller (không được chặn luồng tạo đơn/liên hệ).
   */
  triggerFlushSoon(): void {
    void this.tick();
  }
}
