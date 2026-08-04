<template>
  <MoleculesCommonModal
    ref="modalRef"
    header="Chi tiết đơn hàng"
    :is-show-close="true"
    :width="1100"
    :close-on-click-overlay="false"
  >
    <div v-if="defaultData" class="space-y-6">
      <div
        class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4"
      >
        <div>
          <p class="text-xs text-outline">Đơn hàng - {{ defaultData._id }}</p>
          <div class="mt-1 flex items-center gap-2">
            <AtomsBadge :type="getPurchaseOrderStatusBadgeType(defaultData.status)">
              {{ PurchaseOrderStatusLabels[defaultData.status] }}
            </AtomsBadge>
          </div>
          <p class="mt-2 text-xs text-outline">
            Đặt lúc {{ formatIsoDateTime(defaultData.createdAt) }}
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <AtomsButton
            type="outline"
            :disabled="loadingStates.upsert || defaultData.status === PurchaseOrderStatus.CANCELLED"
            @click="onChangeStatus(PurchaseOrderStatus.CANCELLED)"
          >
            Hủy đơn
          </AtomsButton>

          <!-- <button
            v-if="canPurchaseOrderChangeNextStatus(defaultData.status)"
            class="cursor-pointer bg-transparent"
            @click="onChangeStatus(getPurchaseOrderNextStatus(defaultData.status)!)"
          >
            <AtomsBadge
              :type="
                getPurchaseOrderStatusBadgeType(getPurchaseOrderNextStatus(defaultData.status)!)
              "
            >
              {{ PurchaseOrderStatusLabels[getPurchaseOrderNextStatus(defaultData.status)!] }}
            </AtomsBadge>
          </button> -->
          <AtomsButton
            v-if="canPurchaseOrderChangeNextStatus(defaultData.status)"
            class="cursor-pointer"
            type="quaternary"
            @click="onChangeStatus(getPurchaseOrderNextStatus(defaultData.status)!)"
          >
            {{ PurchaseOrderStatusLabels[getPurchaseOrderNextStatus(defaultData.status)!] }}
          </AtomsButton>
          <AtomsFormSelectBox
            v-model="selectedStatus"
            :options="statusOptions"
            :disabled="loadingStates.upsert"
            class="min-w-44"
            @update:model-value="onChangeStatus"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div class="rounded-2xl border border-outline-variant p-4 md:col-span-8">
          <div class="mb-3 flex items-center justify-between">
            <p class="text-sm font-semibold">
              Sản phẩm trong đơn ({{ defaultData.purchaseItems?.length || 0 }})
            </p>
            <AtomsButton type="ghost">In phiếu</AtomsButton>
          </div>
          <div class="space-y-3 max-h-[360px] overflow-auto pr-1">
            <div
              v-for="(item, index) in defaultData.purchaseItems"
              :key="`${item.productId}-${item.productOptionValueId}-${index}`"
              class="rounded-xl border border-surface-container p-3"
            >
              <div class="grid grid-cols-12 items-center gap-2 text-sm">
                <div class="col-span-6">
                  <NuxtLink
                    :to="`/san-pham/${generateProductSlug(item.product as TExistedProduct)}`"
                    target="_blank"
                    class="font-medium hover:(underline text-primary)"
                  >
                    {{ item.product?.name || `Sản phẩm #${item.productId}` }}
                  </NuxtLink>
                  <p class="text-xs text-outline">
                    {{
                      item.productOptionValue?.productOptionNames?.join(" / ") ||
                      "Không có phân loại"
                    }}
                  </p>
                </div>
                <div class="col-span-2 text-center">
                  <p class="text-xs text-outline">SL</p>
                  <p class="font-medium">{{ item.count }}</p>
                </div>
                <div class="col-span-2 text-right">
                  <p class="text-xs text-outline">Đơn giá</p>
                  <p class="font-medium">{{ formatPrice(item.price || 0) }}</p>
                </div>
                <div class="col-span-2 text-right">
                  <p class="text-xs text-outline">Thành tiền</p>
                  <p class="font-semibold">
                    {{ formatPrice((item.price || 0) * (item.count || 0)) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4 space-y-2 rounded-xl bg-surface-container-low p-3 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-outline">Tạm tính</span>
              <span class="font-medium">{{ formatPrice(summaryPrice) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-outline">Phí vận chuyển (ưu tiên)</span>
              <span class="font-medium">{{ formatPrice(shippingFee) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-outline">Thuế (8%)</span>
              <span class="font-medium">{{ formatPrice(taxAmount) }}</span>
            </div>
            <div class="flex items-center justify-between border-t border-outline-variant pt-2">
              <span class="font-semibold">Tổng cộng</span>
              <span class="text-base font-semibold">{{ formatPrice(grandTotal) }}</span>
            </div>
          </div>
        </div>
        <div class="space-y-4 md:col-span-4">
          <div class="rounded-2xl border border-outline-variant p-4">
            <p class="mb-2 text-sm font-semibold">Khách hàng</p>
            <p class="text-sm font-medium">{{ customerName }}</p>
            <p class="text-xs text-outline">{{ customerPhone || "Không có số điện thoại" }}</p>
            <p v-if="customerEmail" class="text-xs text-outline">{{ customerEmail }}</p>
          </div>
          <div class="rounded-2xl border border-outline-variant p-4">
            <p class="mb-2 text-sm font-semibold">Thông tin vận chuyển</p>
            <p class="text-xs text-outline">Tên người nhận</p>
            <p class="text-sm text-on-surface">
              {{ defaultData?.address?.name || "Chưa có thông tin tên người nhận" }}
            </p>
            <p class="text-xs text-outline">Số điện thoại</p>
            <p class="text-sm text-on-surface">
              {{ defaultData?.address?.phoneNumber || "Chưa có thông tin số điện thoại" }}
            </p>
            <p class="text-xs text-outline">Địa chỉ giao hàng</p>
            <p class="text-sm text-on-surface">
              {{ shippingAddress || "Chưa có thông tin địa chỉ giao hàng" }}
            </p>
          </div>
          <div class="rounded-2xl border border-outline-variant p-4">
            <p class="mb-2 text-sm font-semibold">Thông tin thanh toán</p>
            <p class="text-sm text-on-surface">Trạng thái: {{ paymentStatus }}</p>
            <p class="text-sm text-outline">Mã tham chiếu: {{ paymentRef }}</p>
          </div>
        </div>
      </div>
    </div>
  </MoleculesCommonModal>
</template>

<script setup lang="ts">
import MoleculesCommonModal from "~/components/molecules/common/Modal.vue";
import type { TExistedProduct } from "~/types/product.type";
import {
  PurchaseOrderStatus,
  PurchaseOrderStatusLabels,
  type TExistedPurchaseOrder,
} from "~/types/purchase-order.type";
import { generateProductSlug } from "~/utils/product.utils";
import {
  canPurchaseOrderChangeNextStatus,
  getPurchaseOrderStatusBadgeType,
} from "~/utils/purchase-order.utils";

const modalRef = ref<InstanceType<typeof MoleculesCommonModal>>();

const { defaultData } = defineProps<{
  defaultData?: TExistedPurchaseOrder;
}>();

const emits = defineEmits<{
  (e: "on-update-status-success"): void;
}>();

const { updateOrderStatus, loadingStates } = usePurchaseOrderStore();

const selectedStatus = ref<PurchaseOrderStatus>(PurchaseOrderStatus.PENDING);
const statusOptions = Object.values(PurchaseOrderStatus).map((status) => ({
  label: PurchaseOrderStatusLabels[status],
  value: status,
}));

const onChangeStatus = async (status: PurchaseOrderStatus) => {
  if (!defaultData?._id || defaultData.status === status) return;
  const updatedOrder = await updateOrderStatus(String(defaultData._id), status);
  if (!updatedOrder) return;
  selectedStatus.value = updatedOrder.status;
  emits("on-update-status-success");
};

const summaryPrice = computed(() => defaultData?.purchasePriceDetail?.summaryPrice || 0);
const shippingFee = computed(() => summaryPrice.value * 0.02);
const taxAmount = computed(() => summaryPrice.value * 0.08);
const grandTotal = computed(() => summaryPrice.value + shippingFee.value + taxAmount.value);

const customerName = computed(
  () => defaultData?.user?.name || defaultData?.address?.name || "Khách vãng lai",
);
const customerPhone = computed(
  () => defaultData?.user?.phoneNumber || defaultData?.address?.phoneNumber || "",
);
const customerEmail = computed(() => defaultData?.user?.email || "");
const shippingAddress = computed(() => defaultData?.address?.address || "");
const paymentStatus = computed(() => {
  if (defaultData?.status === PurchaseOrderStatus.CANCELLED) return "Đã hủy";
  if (defaultData?.status === PurchaseOrderStatus.DELIVERED) return "Đã thanh toán";
  return "Đã xác thực";
});
const paymentRef = computed(
  () =>
    `#PO-${String(defaultData?._id || "")
      .slice(-6)
      .toUpperCase()}`,
);
watchEffect(() => {
  selectedStatus.value = defaultData?.status || PurchaseOrderStatus.PENDING;
});

defineExpose({
  openModal: () => modalRef.value?.openModal(),
});
</script>
