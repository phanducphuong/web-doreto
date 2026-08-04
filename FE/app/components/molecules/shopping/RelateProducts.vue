<template>
  <section v-if="relatedProducts.length">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3 px-1.5 sm:mb-8 lg:(mb-12 px-0)">
      <h2 class="text-lg font-semibold text-on-surface sm:text-3xl">Sản phẩm tương tự</h2>
      <NuxtLink
        to="/"
        class="flex items-center gap-1.5 rounded-full gradient-primary px-4 py-2 text-xs text-white font-semibold uppercase tracking-wider shadow-(lg primary/20) transition-all hover:(brightness-110 shadow-xl) active:scale-95"
      >
        Xem thêm
        <ArrowRight class="size-4" />
      </NuxtLink>
    </div>
    <!-- Mobile / tablet: compact square cards, 3 cột — tối đa 2 hàng -->
    <div class="grid grid-cols-3 gap-1.5 sm:gap-3 md:gap-4 lg:hidden">
      <MoleculesProductCompactProductCard
        v-for="p in relatedProducts.slice(0, 6)"
        :key="p._id"
        :product="p"
        flush
        class="overflow-hidden rounded-lg bg-white pb-2"
      />
    </div>
    <!-- PC (lg+): card đầy đủ như listing — tối đa 2 hàng -->
    <div class="hidden grid-cols-2 gap-3 sm:gap-5 lg:grid lg:grid-cols-4 lg:gap-6">
      <MoleculesProductCard
        v-for="p in relatedProducts.slice(0, 8)"
        :key="p._id"
        :product="p"
        flush
        hide-original-price
        class="overflow-hidden rounded-xl bg-white pb-2.5"
      />
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ArrowRight } from "lucide-vue-next";
import type { TExistedProduct } from "~/types/product.type";

defineProps<{
  relatedProducts: TExistedProduct[];
}>();
</script>
