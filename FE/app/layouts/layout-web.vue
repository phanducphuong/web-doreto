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
const { $listen } = useNuxtApp();
const quickViewModalRef = ref<{ openModal: (product: TExistedProduct) => void } | null>(null);

const isHaveFilter = computed(() => {
  return ["san-pham", "danh-muc", "tim-kiem"].includes(route.name as string) || false;
});

onMounted(() => {
  $listen("product:quick-view", (product: TExistedProduct) => {
    quickViewModalRef.value?.openModal(product);
  });
});
</script>
