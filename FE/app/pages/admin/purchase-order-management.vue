<template>
  <section class="space-y-4">
    <div class="mb-6">
      <h1 class="cms-title">Quản lý đơn hàng</h1>
      <p class="mt-1 text-sm text-outline">
        Đang quản lý {{ pagination.total || 0 }} đơn hàng trong hệ thống.
      </p>
    </div>

    <MoleculesAdminPurchaseOrderOverviewCards
      :cards="overviewCards"
      :active-state="params.state"
      @select-state="onSelectOverviewState"
    />

    <MoleculesAdminPurchaseOrderDateRangeFilter
      :from-date="params.fromDate"
      :to-date="params.toDate"
      @apply="onDateRangeApply"
    />

    <AtomsTable
      :columns="columns"
      :data="listPurchaseOrders"
      :pagination="pagination"
      :is-loading="isFetchingOrders"
      @change="onPageChange"
      @select-record="openDetailPurchaseOrderModal"
    >
      <template #product="{ row }">
        <NuxtLink
          v-for="value in row.purchaseItems || []"
          :key="`${row._id}-${value.productId}-${value.productOptionValueId}`"
          :to="{
            name: 'chi-tiet-san-pham',
            params: {
              slug: generateSlug(value.product?.name),
              id: value.productId,
            },
          }"
          class="font-medium text-on-surface hover:(text-primary underline)"
          @click.stop
        >
          {{ value.product?.name || `#${value.productId}` }}
        </NuxtLink>
      </template>
      <template #status="{ row }">
        <AtomsBadge class="whitespace-nowrap" :type="getPurchaseOrderStatusBadgeType(row.status)">
          {{ PurchaseOrderStatusLabels[row.status] }}
        </AtomsBadge>
      </template>
      <template #action="{ row }">
        <AtomsButton
          v-if="canPurchaseOrderChangeNextStatus(row.status)"
          :class="tableActionButtonClass"
          type="quaternary"
          @click="handleNextStatus($event, row._id, getPurchaseOrderNextStatus(row.status)!)"
        >
          {{ PurchaseOrderStatusLabels[getPurchaseOrderNextStatus(row.status)!] }}
        </AtomsButton>
      </template>
    </AtomsTable>

    <ClientOnly>
      <MoleculesVCUPurchaseOrder
        ref="vcuPurchaseOrderRef"
        :default-data="selectedPurchaseOrder"
        @on-update-status-success="onUpdateOrderStatusSuccess"
      />
    </ClientOnly>
  </section>
</template>

<script setup lang="ts">
import type { TTableColumn, TTablePagination } from "~/types/table.type";
import {
  PurchaseOrderStatus,
  PurchaseOrderStatusLabels,
  type TExistedPurchaseOrder,
  type TExistedPurchaseOrderQueryParams,
} from "~/types/purchase-order.type";
import MoleculesVCUPurchaseOrder from "~/components/molecules/VCUPurchaseOrder.vue";
import type { TOrdersOverviewResponse } from "~/types/reporting.type";
import {
  canPurchaseOrderChangeNextStatus,
  getPurchaseOrderStatusBadgeType,
} from "~/utils/purchase-order.utils";

const route = useRoute();
const tableActionButtonClass =
  "cursor-pointer shrink-0 whitespace-nowrap !h-7 !px-2.5 !py-1 !text-xs !rounded-lg";
const { updateQuery } = useUpdateRouteQuery();
const { $purchaseOrderRepository } = useNuxtApp();
const { $reportingRepository } = useNuxtApp();
const { updateOrderStatus } = usePurchaseOrderStore();

const listPurchaseOrders = ref<TExistedPurchaseOrder[]>([]);
const isFetchingOrders = ref(false);
const pagination = ref<TTablePagination>({
  page: 1,
  totalPage: 0,
  total: 0,
  count: 0,
});

const ordersOverview = ref<TOrdersOverviewResponse>({});

const parseStatus = (value: unknown): PurchaseOrderStatus | undefined => {
  if (typeof value !== "string") return undefined;
  const statuses = Object.values(PurchaseOrderStatus);
  return statuses.includes(value as PurchaseOrderStatus)
    ? (value as PurchaseOrderStatus)
    : undefined;
};

const params = computed<TExistedPurchaseOrderQueryParams>(() => ({
  page: parseNumber(route.query.page, 1),
  limit: parseNumber(route.query.limit, 10),
  state: parseStatus(route.query.state),
  fromDate: typeof route.query.fromDate === "string" ? route.query.fromDate : undefined,
  toDate: typeof route.query.toDate === "string" ? route.query.toDate : undefined,
}));

const getNumericValue = (obj: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "number") return value;
  }
  return 0;
};

const overviewCards = computed(() => {
  const source = ordersOverview.value as Record<string, unknown>;
  return [
    {
      key: "totalOrders",
      label: "Tổng đơn",
      value: getNumericValue(source, ["totalOrders", "total", "orderCount"]).toLocaleString(
        "vi-VN",
      ),
      state: undefined,
    },
    {
      key: PurchaseOrderStatus.PENDING,
      label: "Đơn chờ xử lý",
      value: getNumericValue(source, ["pendingCount", "pendingOrders", "pending"]).toLocaleString(
        "vi-VN",
      ),
      state: PurchaseOrderStatus.PENDING,
    },
    {
      key: PurchaseOrderStatus.DELIVERED,
      label: "Đã giao",
      value: getNumericValue(source, [
        "deliveredCount",
        "deliveredOrders",
        "delivered",
      ]).toLocaleString("vi-VN"),
      state: PurchaseOrderStatus.DELIVERED,
    },
    {
      key: PurchaseOrderStatus.CANCELLED,
      label: "Đã hủy",
      value: getNumericValue(source, [
        "cancelledCount",
        "cancelledOrders",
        "cancelled",
      ]).toLocaleString("vi-VN"),
      state: PurchaseOrderStatus.CANCELLED,
    },
  ];
});

const columns = reactive<TTableColumn<TExistedPurchaseOrder>[]>([
  {
    key: "_id",
    title: "Mã đơn hàng",
    colClass: "w-14",
    center: true,
  },
  {
    key: "user.name",
    title: "sản phẩm",
    slotKey: "product",
  },
  {
    key: "purchasePriceDetail.summaryPrice",
    title: "Tổng tiền",
    render: (_, record) => formatPrice(record.purchasePriceDetail?.summaryPrice as number),
  },
  {
    key: "status",
    title: "Trạng thái",
    slotKey: "status",
    colClass: "whitespace-nowrap w-[1%]",
  },
  {
    key: "createdAt",
    title: "Ngày tạo",
    render: (value) => formatIsoDateTime(value as string),
    colClass: "whitespace-nowrap w-[1%]",
  },
  {
    key: "action",
    title: "Thao tác",
    slotKey: "action",
    colClass: "whitespace-nowrap w-[1%]",
  },
]);

const selectedPurchaseOrder = ref<TExistedPurchaseOrder | undefined>();
const vcuPurchaseOrderRef = ref<InstanceType<typeof MoleculesVCUPurchaseOrder>>();

// * METHODS
const openDetailPurchaseOrderModal = (data?: TExistedPurchaseOrder) => {
  selectedPurchaseOrder.value = data;
  vcuPurchaseOrderRef.value?.openModal();
};

const handleNextStatus = async (
  event: MouseEvent,
  orderId: string | number,
  nextStatus: PurchaseOrderStatus,
) => {
  event.stopPropagation();
  const updatedOrder = await updateOrderStatus(orderId, nextStatus);
  if (!updatedOrder) return;
  await fetchPurchaseOrders(true);
  await fetchOrderReporting();
};

const fetchPurchaseOrders = async (disableLoading = false) => {
  try {
    if (!disableLoading) isFetchingOrders.value = true;
    const res = await $purchaseOrderRepository.getMany(params.value);
    listPurchaseOrders.value = res.data;
    pagination.value = {
      page: res.page,
      totalPage: Math.ceil(res.total / Number(params.value.limit || 10)),
      total: res.total,
      count: res.count,
    };
  } finally {
    isFetchingOrders.value = false;
  }
};

const fetchOrderReporting = async () => {
  const dateRangeQuery = {
    fromDate: params.value.fromDate,
    toDate: params.value.toDate,
  };
  const overviewRes = await $reportingRepository.getOrdersOverview(dateRangeQuery);
  ordersOverview.value = overviewRes;
};

const onPageChange = (page: number) => {
  updateQuery({ page });
};

const onUpdateOrderStatusSuccess = async () => {
  await fetchPurchaseOrders();
  await fetchOrderReporting();
  if (!selectedPurchaseOrder.value?._id) return;
  selectedPurchaseOrder.value = listPurchaseOrders.value.find(
    (order) => order._id === selectedPurchaseOrder.value?._id,
  );
};

const onSelectOverviewState = (state?: PurchaseOrderStatus) => {
  updateQuery({
    page: 1,
    state,
  });
};

const onDateRangeApply = (payload: { fromDate?: string; toDate?: string }) => {
  updateQuery({
    page: 1,
    fromDate: payload.fromDate,
    toDate: payload.toDate,
  });
};

watch(
  () => route.query,
  async () => {
    await Promise.all([fetchPurchaseOrders(), fetchOrderReporting()]);
  },
  { immediate: true },
);
</script>
