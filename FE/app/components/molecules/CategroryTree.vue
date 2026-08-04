<template>
  <div class="space-y-4">
    <AtomsCategoryTreeItem
      v-for="category in categoriesWithCount"
      :key="category._id"
      :category="category"
      :is-read-only="true"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{}>();

const { categories, categoryCount } = storeToRefs(useCategoryStore());

const categoriesWithCount = computed(() => {
  return categories.value.map((category) => ({
    ...category,
    count: categoryCount.value?.[category._id] || 0,
  }));
});
</script>
