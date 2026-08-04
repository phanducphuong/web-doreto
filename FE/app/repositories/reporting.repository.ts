import type {
  TOrdersFunnelResponse,
  TOrdersOverviewResponse,
  TOrdersTimeseriesPoint,
  TReportingDateRangeQuery,
  TTopCustomerItem,
  TTopProductItem,
} from "~/types/reporting.type";

const createReportingRepository = ($api: typeof $fetch) => ({
  getOrdersOverview: (params: TReportingDateRangeQuery) =>
    $api<TOrdersOverviewResponse>("/reporting/orders/overview", {
      method: "get",
      params,
    }),
  getOrdersTimeseries: (params: TReportingDateRangeQuery) =>
    $api<TOrdersTimeseriesPoint[]>("/reporting/orders/timeseries", {
      method: "get",
      params,
    }),
  getOrdersFunnel: (params: TReportingDateRangeQuery) =>
    $api<TOrdersFunnelResponse>("/reporting/orders/funnel", {
      method: "get",
      params,
    }),
  getTopProducts: (params: TReportingDateRangeQuery & { limit?: number }) =>
    $api<TTopProductItem[]>("/reporting/products/top", {
      method: "get",
      params: { limit: 10, ...params },
    }),
  getTopCustomers: (params: TReportingDateRangeQuery & { limit?: number }) =>
    $api<TTopCustomerItem[]>("/reporting/customers/top", {
      method: "get",
      params: { limit: 10, ...params },
    }),
});

export default createReportingRepository;
