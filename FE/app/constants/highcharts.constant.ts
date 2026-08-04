import type Highcharts from "highcharts";

const CHART_COLORS = {
  primary: "#2563eb",
  secondary: "#7c3aed",
  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  neutral: "#64748b",
} as const;

export const HIGHCHART_BASE_OPTIONS: Highcharts.Options = {
  credits: { enabled: false },
  legend: { enabled: true },
  title: { text: "" },
  xAxis: {
    lineColor: "#d6d9de",
    labels: { style: { color: "#6b7280" } },
  },
  yAxis: {
    title: { text: "" },
    gridLineColor: "#eceff4",
    labels: { style: { color: "#6b7280" } },
  },
  tooltip: {
    shared: true,
    borderRadius: 10,
  },
};

export const buildOrderTimeseriesOptions = (
  categories: string[],
  orderSeries: number[],
  revenueSeries: number[],
): Highcharts.Options => ({
  ...HIGHCHART_BASE_OPTIONS,
  chart: { type: "line", height: 320 },
  xAxis: {
    ...HIGHCHART_BASE_OPTIONS.xAxis,
    categories,
  },
  yAxis: [
    {
      ...HIGHCHART_BASE_OPTIONS.yAxis,
      title: { text: "Số đơn" },
    },
    {
      ...HIGHCHART_BASE_OPTIONS.yAxis,
      title: { text: "Doanh thu (VND)" },
      opposite: true,
    },
  ],
  series: [
    {
      name: "Số đơn",
      type: "line",
      data: orderSeries,
      color: CHART_COLORS.primary,
    },
    {
      name: "Doanh thu",
      type: "column",
      yAxis: 1,
      data: revenueSeries,
      color: CHART_COLORS.warning,
    },
  ],
});

export const buildOrderStatusTimeseriesOptions = (
  categories: string[],
  seriesMap: {
    pending: number[];
    confirmed: number[];
    shipped: number[];
    delivered: number[];
    cancelled: number[];
  },
): Highcharts.Options => ({
  ...HIGHCHART_BASE_OPTIONS,
  chart: { type: "column", height: 320 },
  plotOptions: {
    column: { stacking: "normal", borderRadius: 3 },
  },
  xAxis: {
    ...HIGHCHART_BASE_OPTIONS.xAxis,
    categories,
  },
  yAxis: {
    ...HIGHCHART_BASE_OPTIONS.yAxis,
    title: { text: "Số đơn theo trạng thái" },
  },
  series: [
    { name: "Pending", type: "column", data: seriesMap.pending, color: CHART_COLORS.warning },
    { name: "Confirmed", type: "column", data: seriesMap.confirmed, color: CHART_COLORS.secondary },
    { name: "Shipped", type: "column", data: seriesMap.shipped, color: CHART_COLORS.primary },
    { name: "Delivered", type: "column", data: seriesMap.delivered, color: CHART_COLORS.success },
    { name: "Cancelled", type: "column", data: seriesMap.cancelled, color: CHART_COLORS.danger },
  ],
});

export const buildFunnelOptions = (seriesData: Highcharts.PointOptionsObject[]): Highcharts.Options => ({
  ...HIGHCHART_BASE_OPTIONS,
  chart: { type: "funnel", height: 320 },
  legend: { enabled: false },
  tooltip: { pointFormat: "<b>{point.y}</b> đơn" },
  series: [
    {
      name: "Số đơn",
      type: "funnel",
      data: seriesData,
      colors: [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.warning, CHART_COLORS.success],
    },
  ],
});

export const buildTopProductsOptions = (
  categories: string[],
  soldSeries: number[],
  revenueSeries: number[],
): Highcharts.Options => ({
  ...HIGHCHART_BASE_OPTIONS,
  chart: { type: "bar", height: 360 },
  xAxis: {
    ...HIGHCHART_BASE_OPTIONS.xAxis,
    categories,
  },
  yAxis: [
    {
      ...HIGHCHART_BASE_OPTIONS.yAxis,
      title: { text: "Số lượng bán" },
    },
    {
      ...HIGHCHART_BASE_OPTIONS.yAxis,
      title: { text: "Doanh thu (VND)" },
      opposite: true,
    },
  ],
  series: [
    {
      name: "Đã bán",
      type: "bar",
      data: soldSeries,
      color: CHART_COLORS.success,
    },
    {
      name: "Doanh thu",
      type: "bar",
      yAxis: 1,
      data: revenueSeries,
      color: CHART_COLORS.secondary,
    },
  ],
});

export const buildTopCustomersOptions = (
  categories: string[],
  revenueSeries: number[],
  orderSeries: number[],
): Highcharts.Options => ({
  ...HIGHCHART_BASE_OPTIONS,
  chart: { type: "bar", height: 360 },
  xAxis: {
    ...HIGHCHART_BASE_OPTIONS.xAxis,
    categories,
  },
  yAxis: [
    {
      ...HIGHCHART_BASE_OPTIONS.yAxis,
      title: { text: "Doanh thu (VND)" },
    },
    {
      ...HIGHCHART_BASE_OPTIONS.yAxis,
      title: { text: "Số đơn" },
      opposite: true,
    },
  ],
  series: [
    {
      name: "Doanh thu",
      type: "bar",
      data: revenueSeries,
      color: CHART_COLORS.primary,
    },
    {
      name: "Số đơn",
      type: "bar",
      yAxis: 1,
      data: orderSeries,
      color: CHART_COLORS.neutral,
    },
  ],
});
