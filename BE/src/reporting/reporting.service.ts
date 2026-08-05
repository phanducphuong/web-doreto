import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PurchaseOrderStatus } from 'src/common/enums/purchase-order.enum';
import { PrismaService } from 'src/prisma/prisma.service';

interface OverviewAgg {
  pendingCount: number;
  deliveredCount: number;
  cancelledCount: number;
  totalOrders: number;
  totalRevenue: number;
}

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(fromDate?: Date, toDate?: Date) {
    const current = await this.aggregateOverview(fromDate, toDate);
    const totalOrders = current.totalOrders;
    const totalRevenue = current.totalRevenue;
    const deliveredCount = current.deliveredCount;
    const previousPeriod = this.buildPreviousPeriod(fromDate, toDate);
    const previous = previousPeriod
      ? await this.aggregateOverview(
          previousPeriod.fromDate,
          previousPeriod.toDate,
        )
      : null;

    return {
      pendingCount: current.pendingCount,
      deliveredCount,
      cancelledCount: current.cancelledCount,
      totalOrders,
      totalRevenue,
      averageOrderValue: deliveredCount ? totalRevenue / deliveredCount : 0,
      previousPeriod: previous
        ? {
            ...previous,
            averageOrderValue: previous.deliveredCount
              ? previous.totalRevenue / previous.deliveredCount
              : 0,
            fromDate: previousPeriod?.fromDate.toISOString(),
            toDate: previousPeriod?.toDate.toISOString(),
          }
        : null,
      growth: {
        revenueGrowthPct: this.calcGrowthPct(
          totalRevenue,
          previous?.totalRevenue ?? null,
        ),
        orderGrowthPct: this.calcGrowthPct(
          totalOrders,
          previous?.totalOrders ?? null,
        ),
        deliveredGrowthPct: this.calcGrowthPct(
          deliveredCount,
          previous?.deliveredCount ?? null,
        ),
        cancelledGrowthPct: this.calcGrowthPct(
          current.cancelledCount,
          previous?.cancelledCount ?? null,
        ),
      },
    };
  }

  async getOrderFunnel(fromDate?: Date, toDate?: Date) {
    const byStatus = await this.countByStatus(fromDate, toDate);

    const pending = byStatus.get(PurchaseOrderStatus.PENDING) ?? 0;
    const confirmed = byStatus.get(PurchaseOrderStatus.CONFIRMED) ?? 0;
    const shipped = byStatus.get(PurchaseOrderStatus.SHIPPED) ?? 0;
    const delivered = byStatus.get(PurchaseOrderStatus.DELIVERED) ?? 0;
    const cancelled = byStatus.get(PurchaseOrderStatus.CANCELLED) ?? 0;

    return {
      pending,
      confirmed,
      shipped,
      delivered,
      cancelled,
      conversion: {
        fromPendingToConfirmedRate: this.calcRate(confirmed, pending),
        fromConfirmedToShippedRate: this.calcRate(shipped, confirmed),
        fromShippedToDeliveredRate: this.calcRate(delivered, shipped),
        cancelRateOnPendingBase: this.calcRate(cancelled, pending),
      },
    };
  }

  async getOrderTimeSeries(fromDate?: Date, toDate?: Date) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        date: string;
        orderCount: number;
        pendingCount: number;
        confirmedCount: number;
        shippedCount: number;
        deliveredCount: number;
        cancelledCount: number;
        revenue: number;
      }>
    >(Prisma.sql`
      SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS date,
        count(*)::int AS "orderCount",
        count(*) FILTER (WHERE status::text = 'pending')::int AS "pendingCount",
        count(*) FILTER (WHERE status::text = 'confirmed')::int AS "confirmedCount",
        count(*) FILTER (WHERE status::text = 'shipped')::int AS "shippedCount",
        count(*) FILTER (WHERE status::text = 'delivered')::int AS "deliveredCount",
        count(*) FILTER (WHERE status::text = 'cancelled')::int AS "cancelledCount",
        coalesce(sum("summaryPrice") FILTER (WHERE status::text = 'delivered'), 0)::float8 AS revenue
      FROM purchase_orders
      WHERE status::text <> 'cart'${this.dateCond(fromDate, toDate)}
      GROUP BY 1
      ORDER BY 1
    `);
    return rows;
  }

  async getTopProducts(fromDate?: Date, toDate?: Date, limit = 10) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        productId: string;
        productName: string | null;
        soldQty: number;
        revenue: number;
        orderCount: number;
      }>
    >(Prisma.sql`
      SELECT pi."productId" AS "productId",
        p.name AS "productName",
        sum(pi.count)::int AS "soldQty",
        coalesce(sum(pi.price * pi.count), 0)::float8 AS revenue,
        count(*)::int AS "orderCount"
      FROM purchase_items pi
      JOIN purchase_orders po ON po.id = pi."orderId"
      LEFT JOIN products p ON p.id = pi."productId"
      WHERE po.status::text = 'delivered'${this.dateCond(fromDate, toDate, 'po')}
      GROUP BY pi."productId", p.name
      ORDER BY revenue DESC
      LIMIT ${limit}
    `);

    return rows.map((row) => ({
      productId: row.productId,
      productName: row.productName ?? `#${row.productId}`,
      soldQty: row.soldQty,
      revenue: row.revenue,
      orderCount: row.orderCount,
    }));
  }

  async getTopCustomers(fromDate?: Date, toDate?: Date, limit = 10) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        customerKey: string;
        customerType: string;
        userId: string | null;
        userName: string | null;
        userEmail: string | null;
        guestEmail: string | null;
        totalRevenue: number;
        orderCount: number;
      }>
    >(Prisma.sql`
      SELECT
        coalesce(po."userId"::text, 'guest:' || coalesce(po."nonLoginUserEmail", 'unknown')) AS "customerKey",
        CASE WHEN po."userId" IS NOT NULL THEN 'user' ELSE 'guest' END AS "customerType",
        max(po."userId"::text) AS "userId",
        max(u.name) AS "userName",
        max(u.email) AS "userEmail",
        max(po."nonLoginUserEmail") AS "guestEmail",
        coalesce(sum(po."summaryPrice"), 0)::float8 AS "totalRevenue",
        count(*)::int AS "orderCount"
      FROM purchase_orders po
      LEFT JOIN users u ON u.id = po."userId"
      WHERE po.status::text = 'delivered'${this.dateCond(fromDate, toDate, 'po')}
      GROUP BY 1, 2
      ORDER BY "totalRevenue" DESC
      LIMIT ${limit}
    `);

    return rows.map((row) => {
      const customerName = row.userName || row.guestEmail || 'Guest';
      const customerEmail = row.userEmail || row.guestEmail || null;
      return {
        customerKey: row.customerKey,
        customerType: row.customerType,
        userId: row.userId,
        customerName,
        customerEmail,
        totalRevenue: row.totalRevenue,
        orderCount: row.orderCount,
        averageOrderValue: row.orderCount
          ? row.totalRevenue / row.orderCount
          : 0,
      };
    });
  }

  async syncByOrderDate(sourceDate?: Date) {
    const targetDate = sourceDate ?? new Date();
    const dateString = this.toDateString(targetDate);
    const { start, end } = this.buildDateRange(dateString);

    await Promise.all([
      this.rebuildOrderDailyReportForDate(dateString, start, end),
      this.rebuildProductDailyReportForDate(dateString, start, end),
    ]);
  }

  private async rebuildOrderDailyReportForDate(
    dateString: string,
    start: Date,
    end: Date,
  ) {
    const groups = await this.prisma.purchaseOrder.groupBy({
      by: ['status'],
      where: { createdAt: { gte: start, lte: end } },
      _count: { _all: true },
      _sum: { summaryPrice: true },
    });

    let orderCount = 0;
    let grossRevenue = 0;
    const counts: Record<string, number> = {};
    for (const g of groups) {
      const c = g._count._all;
      orderCount += c;
      counts[g.status] = c;
      if (g.status === PurchaseOrderStatus.DELIVERED) {
        grossRevenue = g._sum.summaryPrice ?? 0;
      }
    }

    await this.prisma.orderDailyReport.upsert({
      where: { date: dateString },
      update: {
        pendingCount: counts[PurchaseOrderStatus.PENDING] ?? 0,
        confirmedCount: counts[PurchaseOrderStatus.CONFIRMED] ?? 0,
        shippedCount: counts[PurchaseOrderStatus.SHIPPED] ?? 0,
        deliveredCount: counts[PurchaseOrderStatus.DELIVERED] ?? 0,
        cancelledCount: counts[PurchaseOrderStatus.CANCELLED] ?? 0,
        orderCount,
        grossRevenue,
        averageOrderValue: orderCount ? grossRevenue / orderCount : 0,
      },
      create: {
        date: dateString,
        pendingCount: counts[PurchaseOrderStatus.PENDING] ?? 0,
        confirmedCount: counts[PurchaseOrderStatus.CONFIRMED] ?? 0,
        shippedCount: counts[PurchaseOrderStatus.SHIPPED] ?? 0,
        deliveredCount: counts[PurchaseOrderStatus.DELIVERED] ?? 0,
        cancelledCount: counts[PurchaseOrderStatus.CANCELLED] ?? 0,
        orderCount,
        grossRevenue,
        averageOrderValue: orderCount ? grossRevenue / orderCount : 0,
      },
    });
  }

  private async rebuildProductDailyReportForDate(
    dateString: string,
    start: Date,
    end: Date,
  ) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        productId: string;
        soldQty: number;
        revenue: number;
        orderCount: number;
      }>
    >(Prisma.sql`
      SELECT pi."productId" AS "productId",
        sum(pi.count)::int AS "soldQty",
        coalesce(sum(pi.price * pi.count), 0)::float8 AS revenue,
        count(*)::int AS "orderCount"
      FROM purchase_items pi
      JOIN purchase_orders po ON po.id = pi."orderId"
      WHERE po.status::text = 'delivered'
        AND po."createdAt" >= ${start}
        AND po."createdAt" <= ${end}
      GROUP BY pi."productId"
    `);

    await this.prisma.productDailyReport.deleteMany({
      where: { date: dateString },
    });
    if (!rows.length) return;

    await this.prisma.productDailyReport.createMany({
      data: rows.map((row) => ({
        date: dateString,
        productId: row.productId,
        soldQty: row.soldQty,
        revenue: row.revenue,
        orderCount: row.orderCount,
      })),
    });
  }

  // ==== Helpers ====

  /** Điều kiện lọc theo ngày cho câu SQL thô. */
  private dateCond(fromDate?: Date, toDate?: Date, alias?: string): Prisma.Sql {
    const col = alias
      ? Prisma.sql`${Prisma.raw(`${alias}."createdAt"`)}`
      : Prisma.sql`"createdAt"`;
    const conds: Prisma.Sql[] = [];
    if (fromDate) conds.push(Prisma.sql`${col} >= ${fromDate}`);
    if (toDate) conds.push(Prisma.sql`${col} <= ${toDate}`);
    if (!conds.length) return Prisma.empty;
    return Prisma.sql` AND ${Prisma.join(conds, ' AND ')}`;
  }

  private async aggregateOverview(
    fromDate?: Date,
    toDate?: Date,
  ): Promise<OverviewAgg> {
    const groups = await this.prisma.purchaseOrder.groupBy({
      by: ['status'],
      where: this.orderWhere(fromDate, toDate),
      _count: { _all: true },
      _sum: { summaryPrice: true },
    });

    let pendingCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;
    let totalOrders = 0;
    let totalRevenue = 0;

    for (const g of groups) {
      const c = g._count._all;
      totalOrders += c;
      if (g.status === PurchaseOrderStatus.PENDING) pendingCount = c;
      if (g.status === PurchaseOrderStatus.CANCELLED) cancelledCount = c;
      if (g.status === PurchaseOrderStatus.DELIVERED) {
        deliveredCount = c;
        totalRevenue = g._sum.summaryPrice ?? 0;
      }
    }

    return {
      pendingCount,
      deliveredCount,
      cancelledCount,
      totalOrders,
      totalRevenue,
    };
  }

  private async countByStatus(fromDate?: Date, toDate?: Date) {
    const groups = await this.prisma.purchaseOrder.groupBy({
      by: ['status'],
      where: this.orderWhere(fromDate, toDate),
      _count: { _all: true },
    });
    return new Map<string, number>(
      groups.map((g) => [g.status, g._count._all]),
    );
  }

  /** Bỏ đơn ở trạng thái giỏ hàng (cart) khỏi thống kê. */
  private orderWhere(
    fromDate?: Date,
    toDate?: Date,
  ): Prisma.PurchaseOrderWhereInput {
    const where: Prisma.PurchaseOrderWhereInput = {
      status: { not: PurchaseOrderStatus.CART as any },
    };
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) (where.createdAt as Prisma.DateTimeFilter).gte = fromDate;
      if (toDate) (where.createdAt as Prisma.DateTimeFilter).lte = toDate;
    }
    return where;
  }

  private buildPreviousPeriod(fromDate?: Date, toDate?: Date) {
    if (!fromDate || !toDate) return null;
    const durationMs = Math.max(toDate.getTime() - fromDate.getTime(), 0);
    const prevTo = new Date(fromDate.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - durationMs);
    return { fromDate: prevFrom, toDate: prevTo };
  }

  private calcGrowthPct(current: number, previous: number | null) {
    if (previous === null) return null;
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private calcRate(numerator: number, denominator: number) {
    if (!denominator) return 0;
    return (numerator / denominator) * 100;
  }

  // Mốc "ngày" của báo cáo tính theo giờ Việt Nam (UTC+7), DB lưu UTC.
  // Trước đây dùng UTC thẳng: đơn đặt 5h sáng VN bị dồn về ngày hôm trước.
  private static readonly VN_OFFSET_MS = 7 * 60 * 60 * 1000;

  private toDateString(date: Date): string {
    return new Date(date.getTime() + ReportingService.VN_OFFSET_MS)
      .toISOString()
      .slice(0, 10);
  }

  private buildDateRange(dateString: string) {
    // 00:00 giờ VN = 17:00 UTC ngày hôm trước
    const start = new Date(
      new Date(`${dateString}T00:00:00.000Z`).getTime() -
        ReportingService.VN_OFFSET_MS,
    );
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
    return { start, end };
  }
}
