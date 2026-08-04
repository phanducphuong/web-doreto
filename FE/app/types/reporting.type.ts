import type { PurchaseOrderStatus } from "./purchase-order.type";

export type TReportingDateRangeQuery = {
  fromDate?: string;
  toDate?: string;
};

export type TOrdersOverviewResponse = {
  pendingCount?: number;
  deliveredCount?: number;
  cancelledCount?: number;
  totalOrders?: number;
  totalRevenue?: number;
  averageOrderValue?: number;
  previousPeriod?: {
    pendingCount?: number;
    deliveredCount?: number;
    cancelledCount?: number;
    totalOrders?: number;
    totalRevenue?: number;
    averageOrderValue?: number;
    fromDate?: string;
    toDate?: string;
  };
  growth?: {
    revenueGrowthPct?: number;
    orderGrowthPct?: number;
    deliveredGrowthPct?: number;
    cancelledGrowthPct?: number;
  };
  [key: string]: unknown;
};

export type TOrdersTimeseriesPoint = {
  date?: string;
  label?: string;
  orderCount?: number;
  pendingCount?: number;
  confirmedCount?: number;
  shippedCount?: number;
  deliveredCount?: number;
  cancelledCount?: number;
  revenue?: number;
  [key: string]: unknown;
};

export type TOrdersFunnelResponse = {
  pending?: number;
  confirmed?: number;
  shipped?: number;
  delivered?: number;
  cancelled?: number;
  conversion?: {
    fromPendingToConfirmedRate?: number;
    fromConfirmedToShippedRate?: number;
    fromShippedToDeliveredRate?: number;
    cancelRateOnPendingBase?: number;
  };
};

export type TTopProductItem = {
  productId?: number;
  productName?: string;
  soldQty?: number;
  revenue?: number;
  orderCount?: number;
};

export type TTopCustomerItem = {
  customerKey?: string;
  customerType?: "user" | "guest";
  userId?: string | null;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string | null;
  totalRevenue?: number;
  orderCount?: number;
  averageOrderValue?: number;
  [key: string]: unknown;
};
