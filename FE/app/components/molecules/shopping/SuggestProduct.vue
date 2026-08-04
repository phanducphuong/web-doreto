<template>
  <template v-if="suggestProducts.length">
    <div class="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-8 lg:mb-12">
      <div>
        <h2 class="text-(xl on-surface) font-headline sm:text-3xl">Có thể bạn quan tâm</h2>
        <p class="mt-1 text-xs text-stone-500 italic sm:(mt-2 text-sm)">
          Những gợi ý dành riêng cho bạn, có thể kết hợp hoàn hảo với lựa chọn hiện tại.
        </p>
      </div>
      <NuxtLink
        class="border-b border-primary pb-1 text-xs text-primary font-label uppercase tracking-widest transition-opacity hover:opacity-70"
        href="/san-pham"
      >
        Khám phá thêm
      </NuxtLink>
    </div>
    <div class="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:gap-8">
      <MoleculesProductCard
        v-for="product in suggestProducts"
        :key="product._id"
        :product="product"
      />
    </div>
  </template>
</template>

<script setup lang="ts">
import type { TExistedProduct } from "~/types/product.type";

const { $productRepository } = useNuxtApp();
const props = withDefaults(
  defineProps<{
    fetchOnMounted?: boolean;
  }>(),
  {
    fetchOnMounted: false,
  },
);

const { listCartProduct, isCartDrawerOpen } = storeToRefs(usePurchaseOrderStore());

const suggestProducts = ref<TExistedProduct[]>([]);
const hasLoaded = ref(false);

const fetchSuggestProducts = async () => {
  if (hasLoaded.value) return;

  const productIds = Array.from(new Set(listCartProduct.value.map((item) => item.product._id)));
  let keywords: string[] = [];
  try {
    keywords = JSON.parse(localStorage.getItem("historyKeywords") || "[]");
  } catch (error) {
    console.error("Failed to parse keywords from localStorage", error);
    keywords = [];
  }

  const res = await $productRepository.getSuggestedProducts({
    productIds,
    limit: 4,
    keywords: keywords,
  });

  suggestProducts.value = res.data;
  hasLoaded.value = true;
};

watch(
  [isCartDrawerOpen, () => props.fetchOnMounted],
  ([isOpen, shouldFetchOnMounted]) => {
    if (isOpen || shouldFetchOnMounted) {
      void fetchSuggestProducts();
    }
  },
  { immediate: true },
);
</script>
