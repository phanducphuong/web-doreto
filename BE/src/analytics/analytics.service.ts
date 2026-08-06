import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TrackingService } from '../tracking/tracking.service';
import {
  ANALYTICS_API_VERSION,
  ANALYTICS_SESSION_MAX_DURATION_SECONDS,
  ANALYTICS_SITE_ID_DEFAULT,
  ANALYTICS_SITE_ID_ENV,
  ANALYTICS_SITE_LINE_DEFAULT,
  ANALYTICS_SITE_LINE_ENV,
  VN_OFFSET_MS,
} from './analytics.constants';

// Hợp đồng API TỔNG QUÁT (D-02) — plan 02 CRM chép tay type tương ứng,
// KHÔNG share code giữa 2 repo.
export interface AnalyticsCampRow {
  camp: string; // '' = không camp (sentinel, KHÔNG null)
  sessions: number;
  visitors: number; // DISTINCT visitorId toàn khoảng
  pageViews: number;
  productViews: number;
  addToCarts: number;
  beginCheckouts: number;
  orders: number;
  contactForms: number;
  sessionSeconds: number;
  avgSessionSeconds: number | null; // null khi sessions = 0
  conversionRatePct: number | null; // null khi visitors = 0
}

export type AnalyticsTotal = Omit<AnalyticsCampRow, 'camp'>;

export interface AnalyticsSummaryResponse {
  apiVersion: number;
  site: string;
  line: string;
  fromDate: string;
  toDate: string;
  camps: AnalyticsCampRow[];
  total: AnalyticsTotal;
}

// Các cột đếm cộng dồn từ visit_daily_reports (D-06 — không aggregate lại bảng thô).
interface CampCounts {
  sessions: number;
  pageViews: number;
  productViews: number;
  addToCarts: number;
  beginCheckouts: number;
  orders: number;
  contactForms: number;
}

const emptyCounts = (): CampCounts => ({
  sessions: 0,
  pageViews: 0,
  productViews: 0,
  addToCarts: 0,
  beginCheckouts: 0,
  orders: 0,
  contactForms: 0,
});

// round 1 chữ số lẻ; null khi mẫu = 0 (D-05).
const conversionPct = (orders: number, visitors: number): number | null =>
  visitors > 0 ? Math.round((orders / visitors) * 1000) / 10 : null;

// round nguyên; null khi sessions = 0 (D-07).
const avgSeconds = (sessionSeconds: number, sessions: number): number | null =>
  sessions > 0 ? Math.round(sessionSeconds / sessions) : null;

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trackingService: TrackingService,
  ) {}

  /**
   * Tóm tắt funnel/chuyển đổi/thời lượng theo camp trong khoảng ngày.
   * Controller đã validate input (định dạng ngày + độ dài khoảng).
   */
  async buildSummary(
    fromDate: string,
    toDate: string,
  ): Promise<AnalyticsSummaryResponse> {
    // 1) Số funnel từ visit_daily_reports (rebuild idempotent rồi findMany).
    const reports = await this.trackingService.rebuildAndListDailyReports(
      fromDate,
      toDate,
    );
    const countsByCamp = new Map<string, CampCounts>();
    const getCounts = (camp: string): CampCounts => {
      let bucket = countsByCamp.get(camp);
      if (!bucket) {
        bucket = emptyCounts();
        countsByCamp.set(camp, bucket);
      }
      return bucket;
    };
    for (const r of reports) {
      const key = r.camp ?? ''; // bảng đã dùng '' sentinel, guard cho chắc
      const b = getCounts(key);
      b.sessions += r.sessionCount;
      b.pageViews += r.pageViewCount;
      b.productViews += r.productViewCount;
      b.addToCarts += r.addToCartCount;
      b.beginCheckouts += r.beginCheckoutCount;
      b.orders += r.orderSuccessCount;
      b.contactForms += r.contactFormCount;
      // visitorCount BỎ QUA — thay bằng distinct thật ở bước 2.
    }

    // 2) Distinct visitors + thời lượng phiên từ visitor_sessions (on-the-fly, D-07).
    const rangeStart = new Date(
      Date.parse(`${fromDate}T00:00:00.000Z`) - VN_OFFSET_MS,
    );
    const rangeEnd = new Date(
      Date.parse(`${toDate}T00:00:00.000Z`) +
        24 * 60 * 60 * 1000 -
        VN_OFFSET_MS -
        1,
    );
    const sessions = await this.prisma.visitorSession.findMany({
      where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
      select: {
        camp: true,
        visitorId: true,
        createdAt: true,
        lastActivityAt: true,
      },
    });

    const visitorsByCamp = new Map<string, Set<string>>();
    const secondsByCamp = new Map<string, number>();
    const globalVisitors = new Set<string>();
    for (const s of sessions) {
      const key = s.camp ?? ''; // camp null → bucket '' sentinel
      let set = visitorsByCamp.get(key);
      if (!set) {
        set = new Set<string>();
        visitorsByCamp.set(key, set);
      }
      set.add(s.visitorId);
      globalVisitors.add(s.visitorId);
      const rawSeconds = Math.floor(
        (s.lastActivityAt.getTime() - s.createdAt.getTime()) / 1000,
      );
      const clamped = Math.min(
        Math.max(rawSeconds, 0),
        ANALYTICS_SESSION_MAX_DURATION_SECONDS,
      );
      secondsByCamp.set(key, (secondsByCamp.get(key) ?? 0) + clamped);
    }

    // 3) Union key camp của report + session; dựng row theo hợp đồng, sort tăng dần.
    const allCamps = new Set<string>([
      ...countsByCamp.keys(),
      ...visitorsByCamp.keys(),
    ]);
    const camps: AnalyticsCampRow[] = [...allCamps]
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
      .map((camp) => {
        const c = countsByCamp.get(camp) ?? emptyCounts();
        const visitors = visitorsByCamp.get(camp)?.size ?? 0;
        const sessionSeconds = secondsByCamp.get(camp) ?? 0;
        return {
          camp,
          sessions: c.sessions,
          visitors,
          pageViews: c.pageViews,
          productViews: c.productViews,
          addToCarts: c.addToCarts,
          beginCheckouts: c.beginCheckouts,
          orders: c.orders,
          contactForms: c.contactForms,
          sessionSeconds,
          avgSessionSeconds: avgSeconds(sessionSeconds, c.sessions),
          conversionRatePct: conversionPct(c.orders, visitors),
        };
      });

    // 4) total: cộng field số của mọi camp; visitors = distinct toàn cục.
    const total: AnalyticsTotal = camps.reduce<AnalyticsTotal>(
      (acc, c) => {
        acc.sessions += c.sessions;
        acc.pageViews += c.pageViews;
        acc.productViews += c.productViews;
        acc.addToCarts += c.addToCarts;
        acc.beginCheckouts += c.beginCheckouts;
        acc.orders += c.orders;
        acc.contactForms += c.contactForms;
        acc.sessionSeconds += c.sessionSeconds;
        return acc;
      },
      {
        sessions: 0,
        visitors: globalVisitors.size,
        pageViews: 0,
        productViews: 0,
        addToCarts: 0,
        beginCheckouts: 0,
        orders: 0,
        contactForms: 0,
        sessionSeconds: 0,
        avgSessionSeconds: null,
        conversionRatePct: null,
      },
    );
    total.avgSessionSeconds = avgSeconds(total.sessionSeconds, total.sessions);
    total.conversionRatePct = conversionPct(total.orders, total.visitors);

    // 5) Response theo hợp đồng — site/line từ env (default decor tượng).
    return {
      apiVersion: ANALYTICS_API_VERSION,
      site:
        process.env[ANALYTICS_SITE_ID_ENV]?.trim() || ANALYTICS_SITE_ID_DEFAULT,
      line:
        process.env[ANALYTICS_SITE_LINE_ENV]?.trim() ||
        ANALYTICS_SITE_LINE_DEFAULT,
      fromDate,
      toDate,
      camps,
      total,
    };
  }
}
