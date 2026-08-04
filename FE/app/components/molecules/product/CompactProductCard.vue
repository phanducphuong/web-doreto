<template>
  <NuxtLink :to="`/san-pham/${generateProductSlug(product)}`" class="group block min-w-0">
    <div
      class="aspect-square overflow-hidden bg-surface-container-low"
      :class="flush ? 'rounded-none' : 'rounded-md'"
    >
      <AtomsUiImageWithFallback
        :src="product.thumbnailUrls?.[0]"
        :alt="product.name"
        :width="200"
        :height="200"
        format="webp"
        loading="lazy"
        img-class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>
    <p
      class="mt-1.5 line-clamp-2 text-xs leading-snug text-on-surface sm:(mt-2 text-sm)"
      :class="{ 'px-1.5': flush }"
    >
      {{ product.name }}
    </p>
    <div class="mt-0.5" :class="{ 'px-1.5': flush }">
      <p class="text-xs font-semibold text-primary sm:text-sm">
        {{ formatPrice(priceData.minPrice) }}
      </p>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { TExistedProduct } from "~/types/product.type";
import { formatPrice, getProductPriceData } from "~/utils/data.utils";
import { generateProductSlug } from "~/utils/product.utils";

const props = defineProps<{
  product: TExistedProduct;
  /** Ảnh tràn sát viền thẻ (kiểu TikTok Shop), phần chữ tự thêm đệm ngang */
  flush?: boolean;
}>();

const priceData = computed(() => getProductPriceData(props.product, props.product.optionValues));
</script>
