import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { TrackingService } from '../tracking/tracking.service';
import { AnalyticsService } from './analytics.service';

// Mock Prisma: chỉ cần visitorSession.findMany (buildSummary dùng đúng cái này).
function buildPrismaMock() {
  return {
    visitorSession: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
}

// Mock Tracking: chỉ cần rebuildAndListDailyReports (tái dùng aggregate phase 37).
function buildTrackingMock() {
  return {
    rebuildAndListDailyReports: jest.fn().mockResolvedValue([]),
  };
}

// Row report daily (visit_daily_reports) — camp đã là '' sentinel trong bảng.
const reportRow = (over: Record<string, unknown> = {}) => ({
  date: '2026-08-01',
  camp: '',
  sessionCount: 0,
  visitorCount: 0, // BỎ QUA trong buildSummary (thay bằng distinct thật)
  pageViewCount: 0,
  productViewCount: 0,
  addToCartCount: 0,
  beginCheckoutCount: 0,
  orderSuccessCount: 0,
  contactFormCount: 0,
  ...over,
});

// Row visitor_sessions cho tính distinct + thời lượng.
const sess = (
  camp: string | null,
  visitorId: string,
  createdMs: number,
  lastMs: number,
) => ({
  camp,
  visitorId,
  createdAt: new Date(createdMs),
  lastActivityAt: new Date(lastMs),
});

const T0 = Date.parse('2026-08-01T02:00:00.000Z');
const HOUR = 60 * 60 * 1000;

describe('AnalyticsService.buildSummary — funnel/chuyển đổi theo camp (D-05/D-06/D-07)', () => {
  let service: AnalyticsService;
  let prisma: ReturnType<typeof buildPrismaMock>;
  let tracking: ReturnType<typeof buildTrackingMock>;

  beforeEach(async () => {
    prisma = buildPrismaMock();
    tracking = buildTrackingMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: prisma },
        { provide: TrackingService, useValue: tracking },
      ],
    }).compile();
    service = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('Behavior 1: gộp nhiều ngày cùng camp — 8 cột đếm cộng dồn đúng', async () => {
    tracking.rebuildAndListDailyReports.mockResolvedValue([
      reportRow({
        date: '2026-08-01',
        camp: 'S01-A',
        sessionCount: 3,
        pageViewCount: 10,
        productViewCount: 4,
        addToCartCount: 2,
        beginCheckoutCount: 1,
        orderSuccessCount: 1,
        contactFormCount: 0,
      }),
      reportRow({
        date: '2026-08-02',
        camp: 'S01-A',
        sessionCount: 2,
        pageViewCount: 5,
        productViewCount: 2,
        addToCartCount: 1,
        beginCheckoutCount: 1,
        orderSuccessCount: 1,
        contactFormCount: 1,
      }),
    ]);

    const res = await service.buildSummary('2026-08-01', '2026-08-02');
    const a = res.camps.find((c) => c.camp === 'S01-A')!;
    expect(a.sessions).toBe(5);
    expect(a.pageViews).toBe(15);
    expect(a.productViews).toBe(6);
    expect(a.addToCarts).toBe(3);
    expect(a.beginCheckouts).toBe(2);
    expect(a.orders).toBe(2);
    expect(a.contactForms).toBe(1);
    expect(res.apiVersion).toBe(1);
    expect(res.site).toBe('doreto-web');
    expect(res.line).toBe('THOI_TRANG');
  });

  it('Behavior 2: visitors = DISTINCT visitorId (1 khách nhiều phiên = 1; total distinct trên mọi camp)', async () => {
    tracking.rebuildAndListDailyReports.mockResolvedValue([
      reportRow({ camp: 'S01-A', sessionCount: 3 }),
      reportRow({ camp: '', sessionCount: 1 }),
    ]);
    prisma.visitorSession.findMany.mockResolvedValue([
      sess('S01-A', 'V1', T0, T0 + 60000),
      sess('S01-A', 'V1', T0, T0 + 60000), // cùng khách, phiên 2
      sess('S01-A', 'V2', T0, T0 + 60000),
      sess('', 'V2', T0, T0 + 60000), // V2 xuất hiện ở camp khác
    ]);

    const res = await service.buildSummary('2026-08-01', '2026-08-01');
    expect(res.camps.find((c) => c.camp === 'S01-A')!.visitors).toBe(2);
    expect(res.camps.find((c) => c.camp === '')!.visitors).toBe(1);
    expect(res.total.visitors).toBe(2); // V1, V2 distinct toàn cục
  });

  it('Behavior 3: thời lượng phiên clamp 0..1800s (3 giờ → 1800; âm/0 → 0)', async () => {
    tracking.rebuildAndListDailyReports.mockResolvedValue([
      reportRow({ camp: 'S01-A', sessionCount: 3 }),
    ]);
    prisma.visitorSession.findMany.mockResolvedValue([
      sess('S01-A', 'V1', T0, T0 + 3 * HOUR), // 3 giờ → clamp 1800
      sess('S01-A', 'V2', T0, T0), // 0 giây
      sess('S01-A', 'V3', T0, T0 - 100000), // âm → 0
    ]);

    const res = await service.buildSummary('2026-08-01', '2026-08-01');
    const a = res.camps.find((c) => c.camp === 'S01-A')!;
    expect(a.sessionSeconds).toBe(1800);
    expect(a.avgSessionSeconds).toBe(600); // round(1800 / 3 sessions)
  });

  it('Behavior 4a: conversionRatePct = orders / visitors distinct (orders=2, visitors=40 → 5.0)', async () => {
    tracking.rebuildAndListDailyReports.mockResolvedValue([
      reportRow({ camp: 'S01-A', sessionCount: 40, orderSuccessCount: 2 }),
    ]);
    const forty = Array.from({ length: 40 }, (_, i) =>
      sess('S01-A', `V${i}`, T0, T0 + 30000),
    );
    prisma.visitorSession.findMany.mockResolvedValue(forty);

    const res = await service.buildSummary('2026-08-01', '2026-08-01');
    expect(res.camps.find((c) => c.camp === 'S01-A')!.conversionRatePct).toBe(
      5.0,
    );
  });

  it('Behavior 4b: visitors=0 → conversionRatePct null; sessions=0 → avgSessionSeconds null', async () => {
    tracking.rebuildAndListDailyReports.mockResolvedValue([
      reportRow({ camp: 'X', sessionCount: 0, orderSuccessCount: 0 }),
    ]);
    prisma.visitorSession.findMany.mockResolvedValue([]);

    const res = await service.buildSummary('2026-08-01', '2026-08-01');
    const x = res.camps.find((c) => c.camp === 'X')!;
    expect(x.conversionRatePct).toBeNull();
    expect(x.avgSessionSeconds).toBeNull();
  });

  it('Behavior 5: session camp null → gộp vào bucket "" (sentinel)', async () => {
    tracking.rebuildAndListDailyReports.mockResolvedValue([]);
    prisma.visitorSession.findMany.mockResolvedValue([
      sess(null, 'V1', T0, T0 + 60000),
    ]);

    const res = await service.buildSummary('2026-08-01', '2026-08-01');
    const empty = res.camps.find((c) => c.camp === '');
    expect(empty).toBeDefined();
    expect(empty!.visitors).toBe(1);
  });

  it('Behavior 6: camps sort tăng dần theo chuỗi ("" đứng đầu)', async () => {
    tracking.rebuildAndListDailyReports.mockResolvedValue([
      reportRow({ camp: 'S01-B', sessionCount: 1 }),
      reportRow({ camp: 'S01-A', sessionCount: 1 }),
      reportRow({ camp: '', sessionCount: 1 }),
    ]);

    const res = await service.buildSummary('2026-08-01', '2026-08-01');
    expect(res.camps.map((c) => c.camp)).toEqual(['', 'S01-A', 'S01-B']);
  });
});
