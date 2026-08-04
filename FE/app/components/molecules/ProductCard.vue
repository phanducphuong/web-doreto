<template>
  <div class="group grid cursor-pointer gap-1.5 sm:gap-2">
    <div class="overflow-hidden relative" :class="flush ? 'rounded-none' : 'rounded-md'">
      <AtomsUiImageWithFallback
        :src="product?.thumbnailUrls?.[0]"
        :alt="product.name"
        :width="294"
        :height="367"
        format="webp"
        loading="lazy"
        img-class="w-full h-full block aspect-4/5 object-cover lg:group-hover:scale-110 transition-all duration-300"
        @click="handleProductClick"
      />

      <!-- <div
        v-if="priceData.maxDiscountPercent > 0"
        class="absolute left-2 top-2 z-10 aspect-square rounded-full border border-white/20 bg-wax-seal p-1.5 text-[10px] font-bold text-white center-child sm:(left-4 top-4 p-2 text-12px)"
      >
        -{{ priceData.maxDiscountPercent }}%
      </div> -->

      <div class="absolute inset-0 bg-primary/3 pointer-events-none" />
    </div>

    <!-- * TAGS -->
    <div v-if="product.tags?.length" class="flex items-center gap-2 h-6" :class="{ 'px-2': flush }">
      <AtomsBadge v-for="tag in product.tags" :key="tag._id" type="info" :label="tag.name" />
    </div>

    <AtomsTooltip :content="product.name" :show-after="300">
      <NuxtLink
        :to="`/san-pham/${generateProductSlug(product)}`"
        class="line-clamp-2 text-sm leading-snug text-on-surface transition-all lg:hover:text-primary sm:text-base lg:text-xl"
        :class="{ 'px-2': flush }"
      >
        {{ product.name }}
      </NuxtLink>
    </AtomsTooltip>

    <div class="mb-1 flex items-center gap-1 text-xs sm:mb-2 sm:gap-2 sm:text-sm" :class="{ 'px-2': flush }">
      <AtomsUiRating :rating="product?.averageRating || 0" />
      <span class="text-outline-variant">•</span>
      <span
        class="mt-0.5 inline-block text-on-surface-variant/80 font-medium"
        :class="{ italic: !getDisplayPurchaseCount(product) }"
      >
        {{ purchaseLabel }}
      </span>
    </div>

    <!-- * PRICE -->
    <div class="flex items-baseline gap-2" :class="{ 'px-2': flush }">
      <span class="text-sm font-semibold text-primary sm:text-base lg:text-lg">
        {{ formatPrice(priceData.minPrice) }}
      </span>

      <span
        v-if="priceData.originalPrice && !hideOriginalPrice"
        class="text-xs text-on-surface-variant/50 line-through sm:text-sm"
      >
        {{ formatPrice(priceData.originalPrice) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TExistedProduct } from "~/types/product.type";
import { formatPrice, getProductPriceData } from "~/utils/data.utils";
import { generateProductSlug, getDisplayPurchaseCount } from "~/utils/product.utils";

const props = defineProps<{
  product: TExistedProduct;
  /** Ảnh tràn sát viền thẻ (kiểu TikTok Shop), phần chữ tự thêm đệm ngang */
  flush?: boolean;
  /** Ẩn giá gốc gạch ngang (dùng ở khu sản phẩm tương tự) */
  hideOriginalPrice?: boolean;
}>();

const purchaseLabel = computed(() => {
  const displayCount = getDisplayPurchaseCount(props.product);
  if (displayCount > 0) {
    return `Đã bán ${displayCount}`;
  }
  return "Sản phẩm mới";
});

const handleProductClick = () => {
  navigateTo(`/san-pham/${generateProductSlug(props.product)}`);
};

// * COMPUTED
const priceData = computed(() => getProductPriceData(props.product, props.product.optionValues));
</script>

<style lang="scss">
/* .bg-wax-seal {
  background: radial-gradient(circle at 30% 30%, #f08a5a, #d85510);
  box-shadow:
    inset -2px -2px 4px rgba(0, 0, 0, 0.3),
    0 2px 4px rgba(216, 85, 16, 0.3);
} */
</style>
