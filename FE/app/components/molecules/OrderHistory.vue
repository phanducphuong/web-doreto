<template>
  <div class="max-w-5xl space-y-5 sm:space-y-8">
    <div class="flex items-center justify-end gap-2">
      <span class="text-sm text-on-surface">Lọc đơn hàng:</span>
      <AtomsFormSelectBox
        v-model="selectedStatus"
        :options="statusOptions"
        class="w-52 text-on-surface"
        placeholder="Chọn trạng thái"
      />
    </div>
    <div
      v-for="order in displayedPurchaseOrders"
      :key="order._id"
      class="group flex flex-col gap-3 rounded-xl bg-white p-4 transition-all duration-500 hover:shadow-[0_24px_48px_rgba(97,0,0,0.08)] sm:(gap-4 p-6)"
    >
      <div class="flex flex-wrap items-center gap-2">
        <AtomsBadge :type="getPurchaseOrderStatusBadgeType(order.status)">
          {{ PurchaseOrderStatusLabels[order.status] }}
        </AtomsBadge>
        <div
          class="text-10px font-bold uppercase tracking-[0.16em] text-outline sm:(text-xs tracking-[0.2em])"
        >
          Đơn hàng <span>#{{ order._id }}</span>
        </div>
      </div>
      <div
        v-for="item in order.purchaseItems"
        :key="item.productOptionValueId"
        class="flex flex-col items-start gap-3 border-(t outline-variant) pt-3 sm:pt-4 md:(flex-row items-center gap-8)"
      >
        <div
          class="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-surface-container-low sm:(h-20 w-20)"
        >
          <AtomsUiImageWithFallback
            data-alt="ok"
            :src="item.productOptionValue?.imageUrl || item.product?.thumbnailUrls?.[0]"
            :is-nuxt-image="false"
            img-class="w-full h-full object-cover"
          />
          <div class="absolute inset-0 bg-primary/5"></div>
        </div>
        <div class="flex-1">
          <h3 class="mt-1 text-base sm:text-xl">{{ item.product?.name }}</h3>
          <div class="text-xs text-white-fixed-variant sm:text-sm">
            {{ getPurchaseOrderDetailText(item.product!, item.productOptionValue!) }}
          </div>
          <div class="text-xs sm:text-sm">x{{ item.count }}</div>
        </div>
        <div class="w-full text-left font-bold text-primary sm:w-40 sm:text-right">
          {{ formatPrice(item.price) }}
        </div>
      </div>
      <div
        class="flex w-full flex-col gap-3 border-(t outline-variant) pt-3 sm:(flex-row justify-between pt-4)"
      >
        <div>
          <div class="mb-1 text-10px uppercase tracking-widest text-slate-400 sm:text-xs">
            Ngày đặt hàng:
            <span class="text-on-surface font-medium">{{
              formatIsoDateTime(order.createdAt)
            }}</span>
          </div>
          <div
            v-if="order.deliveriedAt"
            class="mb-1 text-10px uppercase tracking-widest text-slate-400 sm:text-xs"
          >
            Ngày giao hàng:
            <span class="text-on-surface font-medium">{{
              formatIsoDateTime(order.deliveriedAt)
            }}</span>
          </div>
        </div>
        <div class="flex items-center gap-2 self-start sm:self-auto">
          <div class="text-xs text-white-fixed-variant sm:text-sm">Thành tiền:</div>
          <div class="text-xl font-bold text-primary sm:text-2xl">
            {{ formatPrice(order.purchasePriceDetail.summaryPrice) }}
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="isEmptyByFilter"
      class="rounded-xl bg-white p-4 text-center text-sm text-on-surface-variant sm:p-6"
    >
      Không có đơn hàng phù hợp với bộ lọc.
    </div>
    <div ref="targetRef" class="h-1"></div>
    <div v-if="isFetching" class="text-sm text-on-surface-variant">Đang tải thêm đơn hàng...</div>
    <div
      v-else-if="isLastPage && purchaseOrders.length"
      class="text-sm text-on-surface-variant text-center"
    >
      Bạn đã xem hết đơn hàng.
    </div>

    <ClientOnly>
      <MoleculesShoppingSuggestProduct :fetch-on-mounted="true" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import {
  PurchaseOrderStatus,
  PurchaseOrderStatusLabels,
  type TExistedPurchaseOrder,
} from "~/types/purchase-order.type";

const { $purchaseOrderRepository } = useNuxtApp();

const purchaseOrders = ref<TExistedPurchaseOrder[]>([]);
const page = ref(1);
const PAGE_LIMIT = 10;
const isLastPage = ref(false);
const isFetching = ref(false);
const ALL_ORDER_STATUS = "all";
const selectedStatus = ref<PurchaseOrderStatus | typeof ALL_ORDER_STATUS>(ALL_ORDER_STATUS);

const filterableStatuses = Object.values(PurchaseOrderStatus).filter(
  (status) => status !== PurchaseOrderStatus.CART,
);
const statusOptions = computed(() => [
  { label: "Tất cả trạng thái", value: ALL_ORDER_STATUS },
  ...filterableStatuses.map((status) => ({
    label: PurchaseOrderStatusLabels[status],
    value: status,
  })),
]);

const displayedPurchaseOrders = computed(() => {
  if (selectedStatus.value === ALL_ORDER_STATUS) return purchaseOrders.value;
  return purchaseOrders.value.filter((order) => order.status === selectedStatus.value);
});
const isEmptyByFilter = computed(() => !displayedPurchaseOrders.value.length && !isFetching.value);

watch(selectedStatus, (value) => {
  // Clear action from SelectBox emits empty string, fallback to "all" to show full list again.
  if (!value) {
    selectedStatus.value = ALL_ORDER_STATUS;
  }
});

const fetchPurchaseOrders = async () => {
  if (isFetching.value || isLastPage.value) return;

  isFetching.value = true;
  try {
    const res = await $purchaseOrderRepository.getPurchaseOrdersByUser({
      page: page.value,
      limit: PAGE_LIMIT,
    });

    const filteredOrders = res.data.filter((order) => order.status !== PurchaseOrderStatus.CART);
    purchaseOrders.value = [...purchaseOrders.value, ...filteredOrders];

    const loadedCount = purchaseOrders.value.length;
    const reachedLastByTotal = loadedCount >= res.total;
    const reachedLastByPageSize = res.data.length < PAGE_LIMIT;

    if (reachedLastByTotal || reachedLastByPageSize) {
      isLastPage.value = true;
      return;
    }

    page.value += 1;
  } finally {
    isFetching.value = false;
  }
};

const { targetRef } = useInfiniteScroll(fetchPurchaseOrders, {
  canLoadMore: computed(() => !isLastPage.value),
  rootMargin: "0px 0px 240px 0px",
});

onMounted(() => {
  void fetchPurchaseOrders();
});
</script>
