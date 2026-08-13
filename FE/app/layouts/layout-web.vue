<template>
  <OrganismsWebHeader />
  <div class="max-w-1312px mx-auto px-4 py-4 py-0 md:(px-8 py-8) flex lg:(gap-12 py-4)">
    <LazyOrganismsProductFilter
      v-if="isHaveFilter"
      :config="layoutConfig.layoutWeb.filter"
      class="hidden lg:block"
    />

    <slot />
  </div>
  <OrganismsWebFooter />

  <ClientOnly>
    <MoleculesProductQuickViewModal ref="quickViewModalRef" />
  </ClientOnly>
</template>
<script setup lang="ts">
import type { TExistedProduct } from "~/types/product.type";

const { layoutConfig } = useAppStore();
const route = useRoute();
const { $listen, $off } = useNuxtApp();
const quickViewModalRef = ref<{ openModal: (product: TExistedProduct) => void } | null>(null);

const isHaveFilter = computed(() => {
  return ["san-pham", "danh-muc", "tim-kiem"].includes(route.name as string) || false;
});

const onQuickView = (product: TExistedProduct) => {
  quickViewModalRef.value?.openModal(product);
};

onMounted(() => {
  $listen("product:quick-view", onQuickView);
});
// Hủy đăng ký khi layout unmount (điều hướng web ↔ admin) để handler không nhân bản
onUnmounted(() => {
  $off("product:quick-view", onQuickView);
});
</script>
