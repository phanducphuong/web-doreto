<template>
  <MoleculesCommonModal
    ref="modalRef"
    :is-show-close="true"
    :width="1000"
    :is-full-screen="isMobile"
    :close-on-click-overlay="true"
    header="Xem nhanh sản phẩm"
    @on-close-modal="onCloseModal"
  >
    <div
      v-if="product"
      class="max-h-[calc(100dvh-7rem)] overflow-y-auto overflow-x-hidden pr-1 sm:pr-2 lg:max-h-none lg:overflow-visible lg:pr-0"
    >
      <div class="grid grid-cols-1 gap-5 md:gap-6 lg:grid-cols-12 lg:gap-8">
        <div class="space-y-3 md:space-y-4 lg:col-span-6">
          <div class="aspect-[4/5] overflow-hidden rounded-lg bg-surface-container-low">
            <AtomsUiImageWithFallback
              :src="selectedImage"
              :width="600"
              :height="760"
              format="webp"
              loading="lazy"
              img-class="h-full w-full object-cover"
            />
          </div>

          <div class="grid grid-cols-4 gap-1.5 sm:gap-2">
            <button
              v-for="image in listImages"
              :key="image"
              type="button"
              class="aspect-square overflow-hidden rounded-md border bg-surface-container-low"
              :class="selectedImage === image ? 'border-primary' : 'border-outline-variant'"
              @click="selectedImage = image"
            >
              <AtomsUiImageWithFallback
                :src="image"
                :width="120"
                :height="120"
                format="webp"
                loading="lazy"
                img-class="h-full w-full object-cover"
              />
            </button>
          </div>
        </div>

        <div class="space-y-3 md:space-y-4 lg:col-span-6">
          <h2 class="text-xl text-on-surface font-semibold leading-tight sm:text-3xl lg:text-4xl">
            {{ product.name }}
          </h2>
          <MoleculesProductPurchaseActions :product="product" @buy-now="closeModal" />
        </div>
      </div>
    </div>
  </MoleculesCommonModal>
</template>

<script setup lang="ts">
import type { TExistedProduct } from "~/types/product.type";
import MoleculesCommonModal from "~/components/molecules/common/Modal.vue";

const modalRef = ref<InstanceType<typeof MoleculesCommonModal>>();
const product = ref<TExistedProduct | null>(null);
const selectedImage = ref<string>("");
const isMobile = ref(false);

const listImages = computed(() => {
  if (!product.value) return [""];
  const optionImages = product.value.optionValues?.flatMap((option) => option.imageUrl || []) || [];
  const productImages = product.value.imageUrls || [];
  const allImages = [...productImages, ...optionImages].filter(Boolean);
  return allImages.length ? allImages : [""];
});

const openModal = (targetProduct: TExistedProduct) => {
  product.value = targetProduct;
  selectedImage.value = listImages.value[0] || "";
  nextTick(() => modalRef.value?.openModal());
};

const closeModal = () => {
  modalRef.value?.closeModal();
};

const onCloseModal = () => {
  product.value = null;
  selectedImage.value = "";
};

const updateDeviceType = () => {
  if (!import.meta.client) return;
  isMobile.value = window.innerWidth <= 767;
};

onMounted(() => {
  updateDeviceType();
  window.addEventListener("resize", updateDeviceType, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateDeviceType);
});

defineExpose({
  openModal,
  closeModal,
});
</script>
