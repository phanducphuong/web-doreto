<template>
  <div class="flex w-full items-center justify-between rounded-full bg-surface-light p-1 text-xs font-medium sm:w-auto">
    <!-- * TABS -->
    <div class="flex overflow-x-auto scrollbar-none">
      <div
        v-for="option in sortOptions"
        :key="option.value"
        class="cursor-pointer whitespace-nowrap p-(x-3 y-2) transition-all duration-300 hover:text-primary sm:p-(x-4 y-2)"
        :class="{
          'text-primary  bg-white rounded-full shadow-sm': currentTab === option.value,
        }"
        @click="setCurrentTab(option.value)"
      >
        {{ option.label }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useTab } from "~/composables/tab.composable";
import type { TProductQueryParams } from "~/types/product.type";

type TSortOption = {
  label: string;
  value: "purchase" | "newest" | "price-asc";
};

const { currentTab, setCurrentTab } = useTab("purchase");

const sortOptions: TSortOption[] = [
  { label: "Bán chạy", value: "purchase" },
  { label: "Mới nhất", value: "newest" },
  { label: "Giá thấp đến cao", value: "price-asc" },
];

const { productQuery } = storeToRefs(useAppStore());

if (import.meta.client) {
  watch(currentTab, (newTab) => {
    let newVal: Partial<TProductQueryParams> = {};
    switch (newTab) {
      case "purchase":
        newVal = {
          sortBy: "purchaseCount",
          sortOrder: "desc",
        };
        break;
      case "price-asc":
        newVal = {
          sortBy: "price",
          sortOrder: "asc",
        };
        break;
      case "newest":
        newVal = {
          sortBy: "updatedAt",
          sortOrder: "desc",
        };
        break;
    }
    productQuery.value = { ...Object.assign(productQuery.value, newVal) };
  });
}
</script>
