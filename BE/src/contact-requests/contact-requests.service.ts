import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { ContactSpamKind, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateContactRequestDto } from './dto/create-contact-request.dto';
import { MarkContactSpamDto } from './dto/mark-contact-spam.dto';
import { CreateContactSpamBlockDto } from './dto/create-contact-spam-block.dto';
import { CrmLeadOutboxService } from 'src/crm-lead-outbox/crm-lead-outbox.service';
import { CrmLeadOutboxWorker } from 'src/crm-lead-outbox/crm-lead-outbox.worker';
import { buildContactLeadPayload } from 'src/crm-lead-outbox/decor-lead-payload';

@Injectable()
export class ContactRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    // Outbox lead decor→CRM (plan 38-03): enqueue in-tx + bắn gần-tức-thì sau commit
    private readonly outbox: CrmLeadOutboxService,
    private readonly worker: CrmLeadOutboxWorker,
  ) {}

  private normalizeEmail(value: string): string {
    return value.trim().toLowerCase();
  }

  private normalizePhone(value: string): string {
    return value.trim();
  }

  private async assertNotSpamBlocked(dto: CreateContactRequestDto) {
    if (dto.email) {
      const value = this.normalizeEmail(dto.email);
      const hit = await this.prisma.contactSpamBlock.findUnique({
        where: { kind_value: { kind: ContactSpamKind.email, value } },
      });
      if (hit) {
        throw new BadRequestException('Email này đã bị chặn');
      }
    }
    if (dto.phone) {
      const value = this.normalizePhone(dto.phone);
      const hit = await this.prisma.contactSpamBlock.findUnique({
        where: { kind_value: { kind: ContactSpamKind.phone, value } },
      });
      if (hit) {
        throw new BadRequestException('Số điện thoại này đã bị chặn');
      }
    }
  }

  async create(dto: CreateContactRequestDto) {
    // Luật spam-block giữ nguyên, chạy TRƯỚC khi tạo liên hệ
    await this.assertNotSpamBlocked(dto);

    // Bọc create + enqueue trong 1 transaction (at-least-once): liên hệ commit thì
    // lead chắc chắn đã xếp hàng — không mất lead. enqueue chỉ là INSERT cùng tx,
    // KHÔNG await gọi CRM ở đây.
    const created = await this.prisma.$transaction(async (tx) => {
      const contact = await tx.contactRequest.create({
        data: {
          name: dto.name,
          phone: dto.phone,
          email: dto.email ? this.normalizeEmail(dto.email) : dto.email,
          // Attribution nguyên văn (D-03/D-06); thiếu = undefined = cột null (D-07)
          visitorId: dto.visitorId,
          camp: dto.camp,
          utm: dto.utm
            ? (JSON.parse(JSON.stringify(dto.utm)) as Prisma.InputJsonValue)
            : undefined,
        },
      });

      // sourceKind: 'contact' → CRM đặt campaignName 'Decor-Liên hệ', KHÔNG doanh thu (D-10)
      await this.outbox.enqueue(tx, {
        sourceKind: 'contact',
        sourceId: contact.id,
        payload: buildContactLeadPayload(contact, dto),
      });

      return contact;
    });

    // Bắn gần-tức-thì sau commit (D-04) — non-blocking, FAIL-SAFE: lỗi worker/CRM
    // KHÔNG bao giờ làm fail request gửi liên hệ (worker nền vẫn gửi lại).
    try {
      this.worker.triggerFlushSoon();
    } catch {
      // nuốt lỗi — liên hệ đã ghi thành công, không được ném ra khách
    }

    return created;
  }

  async findAllPaginated(page: number = 1, limit: number = 20, done?: boolean) {
    const skip = (page - 1) * limit;
    const where = done === undefined ? {} : { done };

    const [data, total] = await Promise.all([
      this.prisma.contactRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contactRequest.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  async setDone(id: string, done: boolean) {
    if (!isUUID(id)) {
      throw new NotFoundException('Không tìm thấy yêu cầu liên hệ');
    }

    // Lỗi Prisma (P2025 → 404) do PrismaExceptionFilter toàn cục ánh xạ
    return this.prisma.contactRequest.update({
      where: { id },
      data: done
        ? { done: true, doneAt: new Date() }
        : { done: false, doneAt: null },
    });
  }

  async findSpamBlocklist(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.contactSpamBlock.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contactSpamBlock.count(),
    ]);
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  async addSpamBlock(dto: CreateContactSpamBlockDto) {
    const value =
      dto.kind === ContactSpamKind.email
        ? this.normalizeEmail(dto.value)
        : this.normalizePhone(dto.value);
    if (!value) {
      throw new BadRequestException('Giá trị không hợp lệ');
    }
    await this.upsertSpamBlock(dto.kind, value);
    return { kind: dto.kind, value };
  }

  private async upsertSpamBlock(kind: ContactSpamKind, rawValue: string) {
    const value =
      kind === ContactSpamKind.email
        ? this.normalizeEmail(rawValue)
        : this.normalizePhone(rawValue);
    if (!value) return;
    await this.prisma.contactSpamBlock.upsert({
      where: { kind_value: { kind, value } },
      update: {},
      create: { kind, value },
    });
  }

  async markSpamFromContactRequest(id: string, dto: MarkContactSpamDto) {
    if (!dto.blockEmail && !dto.blockPhone) {
      throw new BadRequestException(
        'Chọn ít nhất email hoặc số điện thoại để chặn',
      );
    }

    if (!isUUID(id)) {
      throw new NotFoundException('Không tìm thấy yêu cầu liên hệ');
    }

    const doc = await this.prisma.contactRequest.findUnique({ where: { id } });
    if (!doc) {
      throw new NotFoundException('Không tìm thấy yêu cầu liên hệ');
    }

    if (dto.blockEmail) {
      if (!doc.email?.trim()) {
        throw new BadRequestException('Liên hệ này không có email để chặn');
      }
      await this.upsertSpamBlock(ContactSpamKind.email, doc.email);
    }

    if (dto.blockPhone) {
      if (!doc.phone?.trim()) {
        throw new BadRequestException(
          'Liên hệ này không có số điện thoại để chặn',
        );
      }
      await this.upsertSpamBlock(ContactSpamKind.phone, doc.phone);
    }

    return { ok: true };
  }

  async removeSpamBlock(kind: ContactSpamKind, rawValue: string) {
    const value =
      kind === ContactSpamKind.email
        ? this.normalizeEmail(rawValue)
        : this.normalizePhone(rawValue);
    if (!value) {
      throw new BadRequestException('Giá trị không hợp lệ');
    }
    const res = await this.prisma.contactSpamBlock.deleteMany({
      where: { kind, value },
    });
    if (res.count === 0) {
      throw new NotFoundException('Không tìm thấy mục chặn');
    }
    return { ok: true };
  }
}
