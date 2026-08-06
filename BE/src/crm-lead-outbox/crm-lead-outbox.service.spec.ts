import { Test, TestingModule } from '@nestjs/testing';
import { DecorLeadOutbox } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CrmLeadOutboxService } from './crm-lead-outbox.service';
import { CrmWebhookClient } from './crm-webhook.client';
import { OUTBOX_MAX_ATTEMPTS } from './crm-lead-outbox.constants';

function buildPrismaMock() {
  return {
    decorLeadOutbox: {
      upsert: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
    },
  };
}

function buildRow(overrides: Partial<DecorLeadOutbox> = {}): DecorLeadOutbox {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    sourceKind: 'order',
    sourceId: '22222222-2222-4222-8222-222222222222',
    payload: { sourceKind: 'order', sourceId: 'PO-1', phone: '0900000000' },
    status: 'pending',
    attempts: 0,
    lastError: null,
    nextAttemptAt: new Date('2026-08-05T00:00:00.000Z'),
    sentAt: null,
    createdAt: new Date('2026-08-05T00:00:00.000Z'),
    updatedAt: new Date('2026-08-05T00:00:00.000Z'),
    ...overrides,
  } as DecorLeadOutbox;
}

describe('CrmLeadOutboxService', () => {
  let service: CrmLeadOutboxService;
  let prisma: ReturnType<typeof buildPrismaMock>;
  let client: { post: jest.Mock };

  beforeEach(async () => {
    prisma = buildPrismaMock();
    client = { post: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmLeadOutboxService,
        { provide: PrismaService, useValue: prisma },
        { provide: CrmWebhookClient, useValue: client },
      ],
    }).compile();

    service = module.get<CrmLeadOutboxService>(CrmLeadOutboxService);
    jest
      .spyOn((service as any).logger, 'log')
      .mockImplementation(() => undefined);
    jest
      .spyOn((service as any).logger, 'warn')
      .mockImplementation(() => undefined);
    jest
      .spyOn((service as any).logger, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('Test 1: flushOne khi client.post ok → update status sent + sentAt', async () => {
    client.post.mockResolvedValue({ ok: true, status: 200 });
    const row = buildRow();

    await service.flushOne(row);

    expect(client.post).toHaveBeenCalledWith(row.payload);
    expect(prisma.decorLeadOutbox.update).toHaveBeenCalledTimes(1);
    const arg = prisma.decorLeadOutbox.update.mock.calls[0][0];
    expect(arg.where).toEqual({ id: row.id });
    expect(arg.data.status).toBe('sent');
    expect(arg.data.sentAt).toBeInstanceOf(Date);
  });

  it('Test 2: flushOne khi post lỗi lần đầu → status vẫn pending, attempts=1, nextAttemptAt tương lai', async () => {
    client.post.mockResolvedValue({ ok: false, status: 500 });
    const before = Date.now();
    const row = buildRow({ attempts: 0 });

    await service.flushOne(row);

    const arg = prisma.decorLeadOutbox.update.mock.calls[0][0];
    expect(arg.data.status).toBe('pending');
    expect(arg.data.attempts).toBe(1);
    expect(arg.data.nextAttemptAt.getTime()).toBeGreaterThan(before);
    expect(arg.data.lastError).toBeDefined();
  });

  it('Test 3: flushOne khi attempts đạt OUTBOX_MAX_ATTEMPTS → status failed', async () => {
    client.post.mockResolvedValue({ ok: false, error: 'timeout' });
    // attempts hiện tại = MAX-1 → sau +1 = MAX → failed
    const row = buildRow({ attempts: OUTBOX_MAX_ATTEMPTS - 1 });

    await service.flushOne(row);

    const arg = prisma.decorLeadOutbox.update.mock.calls[0][0];
    expect(arg.data.attempts).toBe(OUTBOX_MAX_ATTEMPTS);
    expect(arg.data.status).toBe('failed');
  });

  it('Test 4: enqueue gọi upsert đúng where khóa kép (không tạo trùng)', async () => {
    const tx = {
      decorLeadOutbox: { upsert: jest.fn().mockResolvedValue({}) },
    } as any;

    await service.enqueue(tx, {
      sourceKind: 'order',
      sourceId: 'PO-2026-0001',
      payload: { sourceKind: 'order', sourceId: 'PO-2026-0001', phone: '09' },
    });

    expect(tx.decorLeadOutbox.upsert).toHaveBeenCalledTimes(1);
    const arg = tx.decorLeadOutbox.upsert.mock.calls[0][0];
    expect(arg.where).toEqual({
      sourceKind_sourceId: { sourceKind: 'order', sourceId: 'PO-2026-0001' },
    });
    expect(arg.update).toEqual({});
    expect(arg.create.status).toBe('pending');
    // enqueue KHÔNG được đụng prisma toàn cục (phải dùng tx của caller)
    expect(prisma.decorLeadOutbox.upsert).not.toHaveBeenCalled();
  });

  it('Test 5: flushPending lấy row pending tới hạn rồi gọi flushOne tuần tự', async () => {
    const rows = [buildRow({ id: 'a' }), buildRow({ id: 'b' })];
    prisma.decorLeadOutbox.findMany.mockResolvedValue(rows);
    client.post.mockResolvedValue({ ok: true, status: 200 });

    await service.flushPending();

    const findArg = prisma.decorLeadOutbox.findMany.mock.calls[0][0];
    expect(findArg.where.status).toBe('pending');
    expect(findArg.where.nextAttemptAt.lte).toBeInstanceOf(Date);
    expect(prisma.decorLeadOutbox.update).toHaveBeenCalledTimes(2);
  });
});
