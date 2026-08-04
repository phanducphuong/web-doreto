<template>
  <div class="w-full shrink-0 space-y-4 sm:space-y-6 md:w-60">
    <!-- * CATEGORY -->
    <div v-if="config.category" class="rounded-lg bg-white p-3 shadow-sm">
      <div
        class="mb-3 border-(b solid third-light/30) pb-3 text-(primary base) font-semibold sm:text-lg"
      >
        Duyệt danh mục
      </div>

      <NuxtLink
        v-for="category in categoriesWithCount.filter((cat) => cat.slug)"
        :key="category._id"
        :to="{ name: 'danh-muc', params: { slug: category.slug, id: category._id } }"
        class="mb-2 block text-xs hover:text-primary sm:(mb-3 text-sm)"
        :class="{
          'text-primary': $route.params.slug == category.slug,
        }"
      >
        <AtomsTooltip :content="category.name" :show-after="300">
          <span class="line-clamp-2"> {{ category.name }} ({{ category.count || 0 }}) </span>
        </AtomsTooltip>
      </NuxtLink>
    </div>

    <!-- * FILTER PRICE -->
    <div v-if="config.filter" class="space-y-3 rounded-lg bg-white p-3 shadow-sm">
      <div
        class="mb-3 border-(b solid third-light/30) pb-3 text-(primary base) font-semibold sm:text-lg"
      >
        Khoảng giá
      </div>
      <div class="grid grid-cols-2 gap-2">
        <AtomsFormInput v-model="minPriceInput" type="number" placeholder="Từ" />
        <AtomsFormInput v-model="maxPriceInput" type="number" placeholder="Đến" />
      </div>

      <AtomsButton
        type="primaryGradient"
        circle
        class="!mt-4 w-full text-xs uppercase tracking-wider sm:(!mt-5 text-13px)"
        @click="applyPriceFilter"
      >
        Áp dụng
      </AtomsButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  config: {
    category: boolean;
    filter: boolean;
    sort: boolean;
  };
}>();

const { productQuery } = storeToRefs(useAppStore());
const { categories, categoryCount } = storeToRefs(useCategoryStore());

const categoriesWithCount = computed(() => {
  return categories.value.map((category) => ({
    ...category,
    count: categoryCount.value?.[category._id] || 0,
  }));
});

const minPriceInput = ref<string>("");
const maxPriceInput = ref<string>("");

const toValidPrice = (value: string): number | undefined => {
  if (!value.trim()) return;
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) return;
  return Math.floor(parsed);
};

const applyPriceFilter = () => {
  productQuery.value = {
    ...productQuery.value,
    minPrice: toValidPrice(minPriceInput.value),
    maxPrice: toValidPrice(maxPriceInput.value),
    page: 1,
  };
};
</script>
