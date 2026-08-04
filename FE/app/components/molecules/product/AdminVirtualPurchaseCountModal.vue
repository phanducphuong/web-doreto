<template>
  <MoleculesCommonModal
    ref="modalRef"
    header="Lượt mua ảo"
    :is-show-close="true"
    :width="520"
    :close-on-click-overlay="false"
    @on-close-modal="onClose"
  >
    <div class="space-y-4">
      <div class="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm">
        <p class="font-semibold text-on-surface">{{ product?.name }}</p>
        <div class="mt-3 grid grid-cols-1 gap-2 text-on-surface-variant sm:grid-cols-3">
          <p>Lượt mua thật: <strong class="text-on-surface">{{ realCount }}</strong></p>
          <p>Lượt mua ảo: <strong class="text-on-surface">{{ virtualCount }}</strong></p>
          <p>Hiển thị web: <strong class="text-primary">{{ displayCount }}</strong></p>
        </div>
      </div>

      <AtomsFormItem label="Chỉnh lượt mua ảo" :required="true">
        <AtomsFormInput
          v-model.number="virtualPurchaseCount"
          type="number"
          min="0"
          step="1"
          placeholder="0"
          :disabled="isBusy"
        />
      </AtomsFormItem>

      <p class="text-xs text-on-surface-variant">
        Lượt mua thật được cộng tự động từ đơn hàng và dùng cho báo cáo. Lượt mua ảo chỉ dùng để
        hiển thị trên website.
      </p>

      <AtomsUiInlineError :message="errorMessage" />
    </div>

    <template #footer>
      <AtomsButton type="outline" :disabled="isBusy" @click="closeModal">Hủy</AtomsButton>
      <AtomsButton
        type="primary"
        :is-loading="isBusy"
        :disabled="isBusy || virtualPurchaseCount < 0 || Number.isNaN(virtualPurchaseCount)"
        @click="submitForm"
      >
        Lưu
      </AtomsButton>
    </template>
  </MoleculesCommonModal>
</template>

<script setup lang="ts">
import type { TExistedProduct } from "~/types/product.type";
import MoleculesCommonModal from "~/components/molecules/common/Modal.vue";

const { submitting = false } = defineProps<{
  submitting?: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: { productId: number; virtualPurchaseCount: number }];
}>();

const modalRef = ref<InstanceType<typeof MoleculesCommonModal>>();
const product = ref<TExistedProduct | null>(null);
const virtualPurchaseCount = ref(0);
const errorMessage = ref("");

const isBusy = computed(() => submitting);
const realCount = computed(() => Number(product.value?.purchaseCount ?? 0));
const virtualCount = computed(() => Number(virtualPurchaseCount.value || 0));
const displayCount = computed(() => realCount.value + virtualCount.value);

const openModal = (item: TExistedProduct) => {
  product.value = item;
  virtualPurchaseCount.value = Number(item.virtualPurchaseCount ?? 0);
  errorMessage.value = "";
  nextTick(() => modalRef.value?.openModal());
};

const closeModal = () => {
  modalRef.value?.closeModal();
};

const onClose = () => {
  product.value = null;
  virtualPurchaseCount.value = 0;
  errorMessage.value = "";
};

const submitForm = () => {
  if (!product.value?._id) return;
  if (virtualPurchaseCount.value < 0 || Number.isNaN(virtualPurchaseCount.value)) {
    errorMessage.value = "Lượt mua ảo phải là số không âm.";
    return;
  }

  emit("submit", {
    productId: product.value._id,
    virtualPurchaseCount: virtualPurchaseCount.value,
  });
};

const setError = (message: string) => {
  errorMessage.value = message;
};

defineExpose({
  openModal,
  closeModal,
  setError,
});
</script>
