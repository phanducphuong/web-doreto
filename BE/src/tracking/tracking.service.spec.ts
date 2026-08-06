import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { TrackingService } from './tracking.service';
import { TrackPageViewDto } from './dto/track-page-view.dto';
import { TrackEventDto } from './dto/track-event.dto';

// Mock PrismaService thuần — $transaction nhận mảng promise (khớp cách service gọi)
function buildPrismaMock() {
  return {
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    visitorSession: {
      upsert: jest.fn().mockResolvedValue({}),
      groupBy: jest.fn().mockResolvedValue([]),
      findMany: jest.fn().mockResolvedValue([]),
    },
    pageView: {
      create: jest.fn().mockResolvedValue({}),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    visitorEvent: {
      create: jest.fn().mockResolvedValue({}),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    visitDailyReport: {
      upsert: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
}

const SESSION_ID = '11111111-1111-4111-8111-111111111111';
const VISITOR_ID = '22222222-2222-4222-8222-222222222222';

function buildPageViewDto(): TrackPageViewDto {
  return {
    sessionId: SESSION_ID,
    visitorId: VISITOR_ID,
    path: '/san-pham/den-go',
    url: 'https://doretohome.vn/san-pham/den-go?camp=S01-A%20l%E1%BA%A1',
    referrer: 'https://facebook.com',
    camp: 'S01-A lạ ~!@#', // camp lưu NGUYÊN VĂN kể cả chuỗi lạ (D-03)
    utm: { utm_source: 'facebook', utm_campaign: 'S01-A lạ ~!@#' },
  };
}

describe('TrackingService', () => {
  let service: TrackingService;
  let prisma: ReturnType<typeof buildPrismaMock>;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    prisma = buildPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TrackingService>(TrackingService);
    loggerErrorSpy = jest
      .spyOn((service as any).logger, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('Test 1: ingestPageView với UA bot → { ok: true }, prisma KHÔNG được gọi (D-09)', async () => {
    const result = await service.ingestPageView(
      buildPageViewDto(),
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    );

    expect(result).toEqual({ ok: true });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.visitorSession.upsert).not.toHaveBeenCalled();
    expect(prisma.pageView.create).not.toHaveBeenCalled();
  });

  it('Test 2: ingestPageView bình thường → $transaction gồm session upsert + pageView.create, camp nguyên văn', async () => {
    const dto = buildPageViewDto();
    const result = await service.ingestPageView(dto, 'Mozilla/5.0 (iPhone)');

    expect(result).toEqual({ ok: true });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);

    // (a) upsert session: where theo sessionId, create đầy đủ, update chỉ lastActivityAt
    expect(prisma.visitorSession.upsert).toHaveBeenCalledTimes(1);
    const upsertArg = prisma.visitorSession.upsert.mock.calls[0][0];
    expect(upsertArg.where).toEqual({ id: dto.sessionId });
    expect(upsertArg.create).toEqual(
      expect.objectContaining({
        id: dto.sessionId,
        visitorId: dto.visitorId,
        camp: 'S01-A lạ ~!@#', // giữ NGUYÊN VĂN (D-03)
        utm: dto.utm,
        landingUrl: dto.url,
        referrer: dto.referrer,
        userAgent: 'Mozilla/5.0 (iPhone)',
      }),
    );
    expect(Object.keys(upsertArg.update)).toEqual(['lastActivityAt']);

    // (b) pageView.create với camp nguyên văn
    expect(prisma.pageView.create).toHaveBeenCalledTimes(1);
    const createArg = prisma.pageView.create.mock.calls[0][0];
    expect(createArg.data).toEqual(
      expect.objectContaining({
        sessionId: dto.sessionId,
        visitorId: dto.visitorId,
        camp: 'S01-A lạ ~!@#',
        path: dto.path,
        url: dto.url,
        referrer: dto.referrer,
      }),
    );
  });

  it('Test 3: ingestPageView khi prisma reject → vẫn { ok: true } + logger.error (fail-silent D-07)', async () => {
    prisma.$transaction.mockRejectedValueOnce(new Error('DB sập'));

    const result = await service.ingestPageView(
      buildPageViewDto(),
      'Mozilla/5.0 (iPhone)',
    );

    expect(result).toEqual({ ok: true });
    expect(loggerErrorSpy).toHaveBeenCalled();
  });

  it('Test 4: ingestEvent type order_success + orderId → visitorEvent.create đúng type/orderId; type ngoài whitelist → không gọi prisma', async () => {
    const orderId = '33333333-3333-4333-8333-333333333333';
    const dto: TrackEventDto = {
      sessionId: SESSION_ID,
      visitorId: VISITOR_ID,
      type: 'order_success',
      camp: 'S01-A',
      orderId,
    };

    const result = await service.ingestEvent(dto, 'Mozilla/5.0 (iPhone)');
    expect(result).toEqual({ ok: true });
    expect(prisma.visitorEvent.create).toHaveBeenCalledTimes(1);
    const createArg = prisma.visitorEvent.create.mock.calls[0][0];
    expect(createArg.data).toEqual(
      expect.objectContaining({
        type: 'order_success',
        orderId,
        sessionId: SESSION_ID,
        visitorId: VISITOR_ID,
      }),
    );

    // Type ngoài whitelist: DTO chặn từ ngoài, nhưng service cũng guard trả sớm
    prisma.$transaction.mockClear();
    prisma.visitorEvent.create.mockClear();
    const badDto = { ...dto, type: 'hack_type' as any };
    const badResult = await service.ingestEvent(badDto, 'Mozilla/5.0 (iPhone)');
    expect(badResult).toEqual({ ok: true });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.visitorEvent.create).not.toHaveBeenCalled();
  });

  it('Test 5: rebuildVisitDailyReportForDate → upsert 2 lần, camp null chuẩn hóa thành chuỗi rỗng', async () => {
    prisma.visitorSession.groupBy.mockResolvedValue([
      { camp: null, _count: { _all: 3 } },
      { camp: 'S01-A', _count: { _all: 2 } },
    ]);
    prisma.visitorSession.findMany.mockResolvedValue([
      { visitorId: VISITOR_ID, camp: null },
      { visitorId: '44444444-4444-4444-8444-444444444444', camp: 'S01-A' },
    ]);
    prisma.pageView.groupBy.mockResolvedValue([
      { camp: null, _count: { _all: 5 } },
      { camp: 'S01-A', _count: { _all: 4 } },
    ]);
    prisma.visitorEvent.groupBy.mockResolvedValue([
      { camp: 'S01-A', type: 'product_view', _count: { _all: 1 } },
    ]);

    await service.rebuildVisitDailyReportForDate('2026-08-05');

    expect(prisma.visitDailyReport.upsert).toHaveBeenCalledTimes(2);
    const camps = prisma.visitDailyReport.upsert.mock.calls.map(
      (call) => call[0].where.date_camp.camp,
    );
    // camp null chuẩn hóa thành '' trong where/create
    expect(camps).toEqual(expect.arrayContaining(['', 'S01-A']));

    for (const call of prisma.visitDailyReport.upsert.mock.calls) {
      const arg = call[0];
      expect(arg.where.date_camp.date).toBe('2026-08-05');
      expect(arg.create.date).toBe('2026-08-05');
      expect(arg.create.camp).toBe(arg.where.date_camp.camp);
    }

    const s01Call = prisma.visitDailyReport.upsert.mock.calls.find(
      (call) => call[0].where.date_camp.camp === 'S01-A',
    );
    expect(s01Call?.[0].create).toEqual(
      expect.objectContaining({
        sessionCount: 2,
        visitorCount: 1,
        pageViewCount: 4,
        productViewCount: 1,
      }),
    );
  });
});
