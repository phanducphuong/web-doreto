import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PurchaseOrder,
  PurchaseOrderDocument,
} from 'src/purchase-orders/schemas/purchase-order.schema';
import { PurchaseOrderStatus } from 'src/common/enums/purchase-order.enum';
import {
  OrderDailyReport,
  OrderDailyReportDocument,
} from './schemas/order-daily-report.schema';
import {
  ProductDailyReport,
  ProductDailyReportDocument,
} from './schemas/product-daily-report.schema';

@Injectable()
export class ReportingService {
  constructor(
    @InjectModel(PurchaseOrder.name)
    private readonly purchaseOrderModel: Model<PurchaseOrderDocument>,
    @InjectModel(OrderDailyReport.name)
    private readonly orderDailyReportModel: Model<OrderDailyReportDocument>,
    @InjectModel(ProductDailyReport.name)
    private readonly productDailyReportModel: Model<ProductDailyReportDocument>,
  ) {}

  async getOverview(fromDate?: Date, toDate?: Date) {
    const match = this.buildOrderMatch(fromDate, toDate);
    const current = await this.aggregateOverview(match);
    const totalOrders = current.totalOrders;
    const totalRevenue = current.totalRevenue;
    const deliveredCount = current.deliveredCount;
    const previousPeriod = this.buildPreviousPeriod(fromDate, toDate);
    const previous = previousPeriod
      ? await this.aggregateOverview(
          this.buildOrderMatch(previousPeriod.fromDate, previousPeriod.toDate),
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
    const match = this.buildOrderMatch(fromDate, toDate);
    const rows = await this.purchaseOrderModel
      .aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ])
      .exec();

    const byStatus = new Map<string, number>(
      rows.map((row: { _id: string; count: number }) => [row._id, row.count]),
    );

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
    const match = this.buildOrderMatch(fromDate, toDate);
    return this.purchaseOrderModel
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            orderCount: { $sum: 1 },
            pendingCount: {
              $sum: {
                $cond: [
                  { $eq: ['$status', PurchaseOrderStatus.PENDING] },
                  1,
                  0,
                ],
              },
            },
            confirmedCount: {
              $sum: {
                $cond: [
                  { $eq: ['$status', PurchaseOrderStatus.CONFIRMED] },
                  1,
                  0,
                ],
              },
            },
            shippedCount: {
              $sum: {
                $cond: [
                  { $eq: ['$status', PurchaseOrderStatus.SHIPPED] },
                  1,
                  0,
                ],
              },
            },
            deliveredCount: {
              $sum: {
                $cond: [
                  { $eq: ['$status', PurchaseOrderStatus.DELIVERED] },
                  1,
                  0,
                ],
              },
            },
            cancelledCount: {
              $sum: {
                $cond: [
                  { $eq: ['$status', PurchaseOrderStatus.CANCELLED] },
                  1,
                  0,
                ],
              },
            },
            revenue: {
              $sum: {
                $cond: [
                  { $eq: ['$status', PurchaseOrderStatus.DELIVERED] },
                  '$purchasePriceDetail.summaryPrice',
                  0,
                ],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: '$_id',
            orderCount: 1,
            pendingCount: 1,
            confirmedCount: 1,
            shippedCount: 1,
            deliveredCount: 1,
            cancelledCount: 1,
            revenue: 1,
          },
        },
      ])
      .exec();
  }

  async getTopProducts(fromDate?: Date, toDate?: Date, limit = 10) {
    const match = this.buildOrderMatch(fromDate, toDate);
    const rows = await this.purchaseOrderModel
      .aggregate([
        { $match: { ...match, status: PurchaseOrderStatus.DELIVERED } },
        { $unwind: '$purchaseItems' },
        {
          $group: {
            _id: '$purchaseItems.productId',
            soldQty: { $sum: '$purchaseItems.count' },
            revenue: {
              $sum: {
                $multiply: ['$purchaseItems.price', '$purchaseItems.count'],
              },
            },
            orderCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        {
          $unwind: {
            path: '$product',
            preserveNullAndEmptyArrays: true,
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            productId: '$_id',
            productName: '$product.name',
            soldQty: 1,
            revenue: 1,
            orderCount: 1,
          },
        },
      ])
      .exec();
    return rows.map((row: any) => ({
      ...row,
      productName: row.productName ?? `#${row.productId}`,
    }));
  }

  async getTopCustomers(fromDate?: Date, toDate?: Date, limit = 10) {
    const match = this.buildOrderMatch(fromDate, toDate);
    const rows = await this.purchaseOrderModel
      .aggregate([
        {
          $match: {
            ...match,
            status: PurchaseOrderStatus.DELIVERED,
          },
        },
        {
          $addFields: {
            customerKey: {
              $ifNull: [
                { $toString: '$userId' },
                {
                  $concat: [
                    'guest:',
                    { $ifNull: ['$nonLoginUser.email', 'unknown'] },
                  ],
                },
              ],
            },
            customerType: {
              $cond: [{ $ifNull: ['$userId', false] }, 'user', 'guest'],
            },
          },
        },
        {
          $group: {
            _id: '$customerKey',
            customerType: { $first: '$customerType' },
            userId: { $first: '$userId' },
            guestEmail: { $first: '$nonLoginUser.email' },
            totalRevenue: { $sum: '$purchasePriceDetail.summaryPrice' },
            orderCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $unwind: {
            path: '$user',
            preserveNullAndEmptyArrays: true,
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            customerKey: '$_id',
            customerType: 1,
            userId: 1,
            customerName: {
              $ifNull: ['$user.name', '$guestEmail'],
            },
            customerEmail: {
              $ifNull: ['$user.email', '$guestEmail'],
            },
            totalRevenue: 1,
            orderCount: 1,
            averageOrderValue: {
              $cond: [
                { $eq: ['$orderCount', 0] },
                0,
                { $divide: ['$totalRevenue', '$orderCount'] },
              ],
            },
          },
        },
      ])
      .exec();

    return rows.map((row: any) => ({
      ...row,
      customerName: row.customerName || row.customerEmail || 'Guest',
    }));
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
    const [row] = await this.purchaseOrderModel
      .aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: null,
            pendingCount: {
              $sum: {
                $cond: [
                  { $eq: ['$status', PurchaseOrderStatus.PENDING] },
                  1,
                  0,
                ],
              },
            },
            confirmedCount: {
              $sum: {
                $cond: [
                  { $eq: ['$status', PurchaseOrderStatus.CONFIRMED] },
                  1,
                  0,
                ],
              },
            },
            shippedCount: {
              $sum: {
                $cond: [
                  { $eq: ['$status', PurchaseOrderStatus.SHIPPED] },
                  1,
                  0,
                ],
              },
            },
            deliveredCount: {
              $sum: {
                $cond: [
                  { $eq: ['$status', PurchaseOrderStatus.DELIVERED] },
                  1,
                  0,
                ],
              },
            },
            cancelledCount: {
              $sum: {
                $cond: [
                  { $eq: ['$status', PurchaseOrderStatus.CANCELLED] },
                  1,
                  0,
                ],
              },
            },
            orderCount: { $sum: 1 },
            grossRevenue: {
              $sum: {
                $cond: [
                  { $eq: ['$status', PurchaseOrderStatus.DELIVERED] },
                  '$purchasePriceDetail.summaryPrice',
                  0,
                ],
              },
            },
          },
        },
      ])
      .exec();

    const orderCount = row?.orderCount ?? 0;
    const grossRevenue = row?.grossRevenue ?? 0;

    await this.orderDailyReportModel
      .findOneAndUpdate(
        { date: dateString },
        {
          $set: {
            pendingCount: row?.pendingCount ?? 0,
            confirmedCount: row?.confirmedCount ?? 0,
            shippedCount: row?.shippedCount ?? 0,
            deliveredCount: row?.deliveredCount ?? 0,
            cancelledCount: row?.cancelledCount ?? 0,
            orderCount,
            grossRevenue,
            averageOrderValue: orderCount ? grossRevenue / orderCount : 0,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
  }

  private async rebuildProductDailyReportForDate(
    dateString: string,
    start: Date,
    end: Date,
  ) {
    const rows = await this.purchaseOrderModel
      .aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: PurchaseOrderStatus.DELIVERED,
          },
        },
        { $unwind: '$purchaseItems' },
        {
          $group: {
            _id: '$purchaseItems.productId',
            soldQty: { $sum: '$purchaseItems.count' },
            revenue: {
              $sum: {
                $multiply: ['$purchaseItems.price', '$purchaseItems.count'],
              },
            },
            orderCount: { $sum: 1 },
          },
        },
      ])
      .exec();

    await this.productDailyReportModel.deleteMany({ date: dateString }).exec();
    if (!rows.length) {
      return;
    }

    await this.productDailyReportModel.insertMany(
      rows.map((row: any) => ({
        date: dateString,
        productId: row._id,
        soldQty: row.soldQty,
        revenue: row.revenue,
        orderCount: row.orderCount,
      })),
    );
  }

  private buildOrderMatch(fromDate?: Date, toDate?: Date) {
    const match: Record<string, unknown> = {
      status: { $ne: PurchaseOrderStatus.CART },
    };

    if (!fromDate && !toDate) {
      return match;
    }

    const createdAt: Record<string, Date> = {};
    if (fromDate) {
      createdAt.$gte = fromDate;
    }
    if (toDate) {
      createdAt.$lte = toDate;
    }
    match.createdAt = createdAt;
    return match;
  }

  private async aggregateOverview(match: Record<string, any>) {
    const [result] = await this.purchaseOrderModel
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            pendingCount: {
              $sum: {
                $cond: [
                  { $eq: ['$status', PurchaseOrderStatus.PENDING] },
                  1,
                  0,
                ],
              },
            },
            deliveredCount: {
              $sum: {
                $cond: [
                  { $eq: ['$status', PurchaseOrderStatus.DELIVERED] },
                  1,
                  0,
                ],
              },
            },
            cancelledCount: {
              $sum: {
                $cond: [
                  { $eq: ['$status', PurchaseOrderStatus.CANCELLED] },
                  1,
                  0,
                ],
              },
            },
            totalOrders: { $sum: 1 },
            totalRevenue: {
              $sum: {
                $cond: [
                  { $eq: ['$status', PurchaseOrderStatus.DELIVERED] },
                  '$purchasePriceDetail.summaryPrice',
                  0,
                ],
              },
            },
          },
        },
      ])
      .exec();

    return {
      pendingCount: result?.pendingCount ?? 0,
      deliveredCount: result?.deliveredCount ?? 0,
      cancelledCount: result?.cancelledCount ?? 0,
      totalOrders: result?.totalOrders ?? 0,
      totalRevenue: result?.totalRevenue ?? 0,
    };
  }

  private buildPreviousPeriod(fromDate?: Date, toDate?: Date) {
    if (!fromDate || !toDate) {
      return null;
    }

    const durationMs = Math.max(toDate.getTime() - fromDate.getTime(), 0);
    const prevTo = new Date(fromDate.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - durationMs);

    return {
      fromDate: prevFrom,
      toDate: prevTo,
    };
  }

  private calcGrowthPct(current: number, previous: number | null) {
    if (previous === null) {
      return null;
    }
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  }

  private calcRate(numerator: number, denominator: number) {
    if (!denominator) {
      return 0;
    }
    return (numerator / denominator) * 100;
  }

  private toDateString(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private buildDateRange(dateString: string) {
    const start = new Date(`${dateString}T00:00:00.000Z`);
    const end = new Date(`${dateString}T23:59:59.999Z`);
    return { start, end };
  }
}
