<template>
  <section class="space-y-4">
    <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="cms-title">Dashboard đơn hàng</h1>
        <p class="mt-1 text-sm text-outline">Tổng quan hiệu suất đơn hàng theo thời gian.</p>
      </div>
      <AtomsButton type="outline" @click="goToOrderManagement">Quản lý đơn hàng</AtomsButton>
    </div>

    <MoleculesAdminPurchaseOrderDateRangeFilter
      :from-date="params.fromDate"
      :to-date="params.toDate"
      @apply="onDateRangeApply"
    />

    <MoleculesAdminPurchaseOrderOverviewCards
      :cards="overviewCards"
      @select-state="onSelectOverviewState"
    />

    <MoleculesAdminPurchaseOrderReportingCharts
      :timeseries-options="timeseriesOptions"
      :status-timeseries-options="statusTimeseriesOptions"
      :funnel-options="funnelOptions"
      :top-products-options="topProductsOptions"
      :top-customers-options="topCustomersOptions"
      :funnel-conversion-texts="funnelConversionTexts"
    />
  </section>
</template>

<script setup lang="ts">
import type { PointOptionsObject } from "highcharts";
import {
  buildFunnelOptions,
  buildOrderTimeseriesOptions,
  buildOrderStatusTimeseriesOptions,
  buildTopCustomersOptions,
  buildTopProductsOptions,
} from "~/constants/highcharts.constant";
import {
  PurchaseOrderStatus,
  type TExistedPurchaseOrderQueryParams,
} from "~/types/purchase-order.type";
import type {
  TOrdersFunnelResponse,
  TOrdersOverviewResponse,
  TOrdersTimeseriesPoint,
  TTopCustomerItem,
  TTopProductItem,
} from "~/types/reporting.type";

const route = useRoute();
const router = useRouter();
const { updateQuery } = useUpdateRouteQuery();
const { $reportingRepository } = useNuxtApp();

const ordersOverview = ref<TOrdersOverviewResponse>({});
const ordersTimeseries = ref<TOrdersTimeseriesPoint[]>([]);
const ordersFunnel = ref<TOrdersFunnelResponse>({});
const topProducts = ref<TTopProductItem[]>([]);
const topCustomers = ref<TTopCustomerItem[]>([]);

const params = computed<TExistedPurchaseOrderQueryParams>(() => ({
  fromDate: typeof route.query.fromDate === "string" ? route.query.fromDate : undefined,
  toDate: typeof route.query.toDate === "string" ? route.query.toDate : undefined,
}));

const overviewCards = computed(() => {
  const source = ordersOverview.value;
  const growth = source.growth || {};
  return [
    {
      key: "totalOrders",
      label: "Tổng đơn",
      value: Number(source.totalOrders || 0).toLocaleString("vi-VN"),
      trendText:
        typeof growth.orderGrowthPct === "number"
          ? `${growth.orderGrowthPct >= 0 ? "+" : ""}${growth.orderGrowthPct.toFixed(1)}% so với kỳ trước`
          : undefined,
      trendPositive: (growth.orderGrowthPct || 0) >= 0,
      state: undefined,
    },
    {
      key: PurchaseOrderStatus.PENDING,
      label: "Đơn chờ xử lý",
      value: Number(source.pendingCount || 0).toLocaleString("vi-VN"),
      state: PurchaseOrderStatus.PENDING,
    },
    {
      key: PurchaseOrderStatus.DELIVERED,
      label: "Đã giao",
      value: Number(source.deliveredCount || 0).toLocaleString("vi-VN"),
      trendText:
        typeof growth.deliveredGrowthPct === "number"
          ? `${growth.deliveredGrowthPct >= 0 ? "+" : ""}${growth.deliveredGrowthPct.toFixed(1)}% so với kỳ trước`
          : undefined,
      trendPositive: (growth.deliveredGrowthPct || 0) >= 0,
      state: PurchaseOrderStatus.DELIVERED,
    },
    {
      key: PurchaseOrderStatus.CANCELLED,
      label: "Đã hủy",
      value: Number(source.cancelledCount || 0).toLocaleString("vi-VN"),
      trendText:
        typeof growth.cancelledGrowthPct === "number"
          ? `${growth.cancelledGrowthPct >= 0 ? "+" : ""}${growth.cancelledGrowthPct.toFixed(1)}% so với kỳ trước`
          : undefined,
      trendPositive: (growth.cancelledGrowthPct || 0) <= 0,
      state: PurchaseOrderStatus.CANCELLED,
    },
    {
      key: "revenue",
      label: "Doanh thu",
      value: formatPrice(Number(source.totalRevenue || 0)),
      trendText:
        typeof growth.revenueGrowthPct === "number"
          ? `${growth.revenueGrowthPct >= 0 ? "+" : ""}${growth.revenueGrowthPct.toFixed(1)}% so với kỳ trước`
          : undefined,
      trendPositive: (growth.revenueGrowthPct || 0) >= 0,
    },
    {
      key: "aov",
      label: "AOV",
      value: formatPrice(Math.round(source.averageOrderValue || 0)),
      subValue: source.previousPeriod?.averageOrderValue
        ? `Kỳ trước: ${formatPrice(Math.round(source.previousPeriod.averageOrderValue))}`
        : undefined,
    },
  ];
});

const timeseriesOptions = computed(() => {
  const categories = ordersTimeseries.value.map((item) =>
    String(item.date || item.label || "").slice(0, 10),
  );
  const orderSeries = ordersTimeseries.value.map((item) => Number(item.orderCount ?? 0));
  const revenueSeries = ordersTimeseries.value.map((item) => Number(item.revenue ?? 0));
  return buildOrderTimeseriesOptions(categories, orderSeries, revenueSeries);
});

const statusTimeseriesOptions = computed(() => {
  const categories = ordersTimeseries.value.map((item) => String(item.date || "--"));
  return buildOrderStatusTimeseriesOptions(categories, {
    pending: ordersTimeseries.value.map((item) => Number(item.pendingCount ?? 0)),
    confirmed: ordersTimeseries.value.map((item) => Number(item.confirmedCount ?? 0)),
    shipped: ordersTimeseries.value.map((item) => Number(item.shippedCount ?? 0)),
    delivered: ordersTimeseries.value.map((item) => Number(item.deliveredCount ?? 0)),
    cancelled: ordersTimeseries.value.map((item) => Number(item.cancelledCount ?? 0)),
  });
});

const funnelOptions = computed(() => {
  const source = ordersFunnel.value;
  const seriesData: PointOptionsObject[] = [
    { name: "Pending", y: Number(source.pending ?? 0) },
    { name: "Confirmed", y: Number(source.confirmed ?? 0) },
    { name: "Shipped", y: Number(source.shipped ?? 0) },
    { name: "Delivered", y: Number(source.delivered ?? 0) },
    { name: "Cancelled", y: Number(source.cancelled ?? 0) },
  ];
  return buildFunnelOptions(seriesData);
});

const funnelConversionTexts = computed(() => {
  const conversion = ordersFunnel.value.conversion;
  if (!conversion) return [];
  const formatPct = (value?: number) =>
    typeof value === "number" ? `${value.toFixed(1)}%` : "N/A";
  return [
    `Pending -> Confirmed: ${formatPct(conversion.fromPendingToConfirmedRate)}`,
    `Confirmed -> Shipped: ${formatPct(conversion.fromConfirmedToShippedRate)}`,
    `Shipped -> Delivered: ${formatPct(conversion.fromShippedToDeliveredRate)}`,
    `Cancel rate (trên pending): ${formatPct(conversion.cancelRateOnPendingBase)}`,
  ];
});

const topProductsOptions = computed(() => {
  const categories = topProducts.value.map((item) => item.productName || "N/A");
  const soldSeries = topProducts.value.map((item) => Number(item.soldQty ?? 0));
  const revenueSeries = topProducts.value.map((item) => Number(item.revenue ?? 0));
  return buildTopProductsOptions(categories, soldSeries, revenueSeries);
});

const topCustomersOptions = computed(() => {
  const categories = topCustomers.value.map(
    (item) => item.customerName || item.customerPhone || item.customerEmail || "N/A",
  );
  const revenueSeries = topCustomers.value.map((item) => Number(item.totalRevenue ?? 0));
  const orderSeries = topCustomers.value.map((item) => Number(item.orderCount ?? 0));
  return buildTopCustomersOptions(categories, revenueSeries, orderSeries);
});

const normalizeArrayResponse = <T,>(response: unknown): T[] => {
  if (Array.isArray(response)) return response as T[];
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    Array.isArray((response as { data?: unknown[] }).data)
  ) {
    return (response as { data: T[] }).data;
  }
  return [];
};

const normalizeObjectResponse = <T,>(response: unknown): T => {
  if (response && typeof response === "object" && "data" in response) {
    return ((response as { data?: T }).data || {}) as T;
  }
  return (response || {}) as T;
};

const fetchOrderReporting = async () => {
  const dateRangeQuery = {
    fromDate: params.value.fromDate,
    toDate: params.value.toDate,
  };
  const [overviewRes, timeseriesRes, funnelRes, topProductsRes, topCustomersRes] =
    await Promise.all([
      $reportingRepository.getOrdersOverview(dateRangeQuery),
      $reportingRepository.getOrdersTimeseries(dateRangeQuery),
      $reportingRepository.getOrdersFunnel(dateRangeQuery),
      $reportingRepository.getTopProducts({ ...dateRangeQuery, limit: 10 }),
      $reportingRepository.getTopCustomers({ ...dateRangeQuery, limit: 10 }),
    ]);

  ordersOverview.value = overviewRes;
  ordersTimeseries.value = normalizeArrayResponse<TOrdersTimeseriesPoint>(timeseriesRes);
  ordersFunnel.value = normalizeObjectResponse<TOrdersFunnelResponse>(funnelRes);
  topProducts.value = normalizeArrayResponse<TTopProductItem>(topProductsRes);
  topCustomers.value = normalizeArrayResponse<TTopCustomerItem>(topCustomersRes);
};

const onDateRangeApply = (payload: { fromDate?: string; toDate?: string }) => {
  updateQuery({
    fromDate: payload.fromDate,
    toDate: payload.toDate,
  });
};

const onSelectOverviewState = (state?: PurchaseOrderStatus) => {
  router.push({
    path: "/admin/quan-ly-don-hang",
    query: {
      ...(params.value.fromDate ? { fromDate: params.value.fromDate } : {}),
      ...(params.value.toDate ? { toDate: params.value.toDate } : {}),
      ...(state ? { state } : {}),
    },
  });
};

const goToOrderManagement = () => {
  onSelectOverviewState();
};

watch(
  () => route.query,
  () => {
    fetchOrderReporting();
  },
  { immediate: true },
);
</script>
