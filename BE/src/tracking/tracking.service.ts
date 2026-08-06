import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { TrackPageViewDto } from './dto/track-page-view.dto';
import { TrackEventDto } from './dto/track-event.dto';
import {
  BOT_UA_REGEX,
  VISITOR_EVENT_TYPES,
} from './tracking.constants';

// Mốc "ngày" báo cáo tính theo giờ Việt Nam (UTC+7), DB lưu UTC —
// mirror đúng ngữ nghĩa múi giờ của reporting.service.ts.
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // UA rỗng/undefined KHÔNG coi là bot (app WebView có thể gửi UA lạ)
  private isLikelyBot(userAgent?: string): boolean {
    if (!userAgent) return false;
    return BOT_UA_REGEX.test(userAgent);
  }

  /**
   * Ghi page view + upsert session. Endpoint public — tracking hỏng không được
   * văng lỗi ra ngoài (fail-silent, D-07): mọi lỗi DB chỉ log, luôn trả { ok: true }.
   * Chuỗi page_views.createdAt + visitor_sessions.lastActivityAt là nguồn đo
   * thời gian khách ở web (D-05 — timestamp rời, không heartbeat).
   */
  async ingestPageView(dto: TrackPageViewDto, userAgent?: string) {
    if (this.isLikelyBot(userAgent)) {
      // Bot phổ biến: bỏ qua, không ghi DB (D-09)
      return { ok: true };
    }

    try {
      await this.prisma.$transaction([
        // Session luôn tồn tại trước khi FK page_views trỏ vào
        this.prisma.visitorSession.upsert({
          where: { id: dto.sessionId },
          create: {
            id: dto.sessionId,
            visitorId: dto.visitorId,
            camp: dto.camp, // lưu NGUYÊN VĂN, không map (D-03)
            utm: dto.utm
              ? (dto.utm as unknown as Prisma.InputJsonValue)
              : undefined,
            landingUrl: dto.url,
            referrer: dto.referrer,
            userAgent: userAgent?.slice(0, 512),
          },
          update: { lastActivityAt: new Date() },
        }),
        this.prisma.pageView.create({
          data: {
            sessionId: dto.sessionId,
            visitorId: dto.visitorId,
            camp: dto.camp,
            path: dto.path,
            url: dto.url,
            referrer: dto.referrer,
          },
        }),
      ]);
    } catch (error) {
      // Tracking hỏng không được làm hỏng trang — lỗi vẫn ra log (D-07)
      this.logger.error('Ghi page view thất bại', error);
    }
    return { ok: true };
  }

  /**
   * Ghi 1 sự kiện funnel (whitelist 5 loại — D-05). Cùng khuôn fail-silent.
   */
  async ingestEvent(dto: TrackEventDto, userAgent?: string) {
    if (this.isLikelyBot(userAgent)) {
      return { ok: true };
    }
    // DTO đã chặn từ ngoài, nhưng service vẫn guard trả sớm cho chắc
    if (!(VISITOR_EVENT_TYPES as readonly string[]).includes(dto.type)) {
      return { ok: true };
    }

    try {
      await this.prisma.$transaction([
        // Event có thể tới trước page view — landingUrl để null
        this.prisma.visitorSession.upsert({
          where: { id: dto.sessionId },
          create: {
            id: dto.sessionId,
            visitorId: dto.visitorId,
            camp: dto.camp,
            utm: dto.utm
              ? (dto.utm as unknown as Prisma.InputJsonValue)
              : undefined,
            landingUrl: null,
            userAgent: userAgent?.slice(0, 512),
          },
          update: { lastActivityAt: new Date() },
        }),
        this.prisma.visitorEvent.create({
          data: {
            sessionId: dto.sessionId,
            visitorId: dto.visitorId,
            camp: dto.camp,
            type: dto.type,
            productId: dto.productId,
            orderId: dto.orderId,
          },
        }),
      ]);
    } catch (error) {
      this.logger.error('Ghi visitor event thất bại', error);
    }
    return { ok: true };
  }

  /**
   * Rebuild nguyên ngày báo cáo visit theo (date, camp) rồi upsert — idempotent,
   * chạy lại không nhân đôi (analog rebuildOrderDailyReportForDate, per D-08).
   * camp null chuẩn hóa thành '' (sentinel unique kép của visit_daily_reports).
   */
  async rebuildVisitDailyReportForDate(dateString: string) {
    const { start, end } = this.buildDateRange(dateString);
    const where = { createdAt: { gte: start, lte: end } };

    const [sessionGroups, distinctVisitors, pageViewGroups, eventGroups] =
      await Promise.all([
        this.prisma.visitorSession.groupBy({
          by: ['camp'],
          where,
          _count: { _all: true },
        }),
        // Đếm visitor distinct theo camp — lượng session/ngày shop nhỏ,
        // chấp nhận reduce trong JS thay vì raw SQL
        this.prisma.visitorSession.findMany({
          where,
          distinct: ['visitorId', 'camp'],
          select: { visitorId: true, camp: true },
        }),
        this.prisma.pageView.groupBy({
          by: ['camp'],
          where,
          _count: { _all: true },
        }),
        this.prisma.visitorEvent.groupBy({
          by: ['camp', 'type'],
          where,
          _count: { _all: true },
        }),
      ]);

    type Numbers = {
      sessionCount: number;
      visitorCount: number;
      pageViewCount: number;
      productViewCount: number;
      addToCartCount: number;
      beginCheckoutCount: number;
      orderSuccessCount: number;
      contactFormCount: number;
    };
    const byCamp = new Map<string, Numbers>();
    const getBucket = (camp: string | null): Numbers => {
      const key = camp ?? ''; // chuẩn hóa NULL → chuỗi rỗng
      let bucket = byCamp.get(key);
      if (!bucket) {
        bucket = {
          sessionCount: 0,
          visitorCount: 0,
          pageViewCount: 0,
          productViewCount: 0,
          addToCartCount: 0,
          beginCheckoutCount: 0,
          orderSuccessCount: 0,
          contactFormCount: 0,
        };
        byCamp.set(key, bucket);
      }
      return bucket;
    };

    for (const g of sessionGroups) {
      getBucket(g.camp).sessionCount = g._count._all;
    }
    for (const row of distinctVisitors) {
      getBucket(row.camp).visitorCount += 1;
    }
    for (const g of pageViewGroups) {
      getBucket(g.camp).pageViewCount = g._count._all;
    }
    const eventField: Record<string, keyof Numbers> = {
      product_view: 'productViewCount',
      add_to_cart: 'addToCartCount',
      begin_checkout: 'beginCheckoutCount',
      order_success: 'orderSuccessCount',
      contact_form: 'contactFormCount',
    };
    for (const g of eventGroups) {
      const field = eventField[g.type];
      if (!field) continue; // type lạ trong DB (nếu có) — bỏ qua, không vỡ aggregate
      getBucket(g.camp)[field] += g._count._all;
    }

    for (const [camp, numbers] of byCamp) {
      await this.prisma.visitDailyReport.upsert({
        where: { date_camp: { date: dateString, camp } },
        update: { ...numbers },
        create: { date: dateString, camp, ...numbers },
      });
    }
  }

  /**
   * Rebuild từng ngày trong khoảng rồi trả rows — cho endpoint admin (D-08, không cron).
   * Controller đã validate định dạng + độ dài khoảng ngày.
   */
  async rebuildAndListDailyReports(fromDate: string, toDate: string) {
    for (
      let cursor = new Date(`${fromDate}T00:00:00.000Z`);
      cursor.toISOString().slice(0, 10) <= toDate;
      cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)
    ) {
      await this.rebuildVisitDailyReportForDate(
        cursor.toISOString().slice(0, 10),
      );
    }

    return this.prisma.visitDailyReport.findMany({
      where: { date: { gte: fromDate, lte: toDate } },
      orderBy: [{ date: 'asc' }, { camp: 'asc' }],
    });
  }

  // 00:00 giờ VN = 17:00 UTC ngày hôm trước (mirror reporting.service.buildDateRange)
  private buildDateRange(dateString: string) {
    const start = new Date(
      new Date(`${dateString}T00:00:00.000Z`).getTime() - VN_OFFSET_MS,
    );
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
    return { start, end };
  }
}
