<template>
  <NuxtLink
    :to="{
      name: 'danh-muc',
      params: {
        slug: category.slug,
        id: category._id,
      },
    }"
  >
    <div
      class="group relative overflow-hidden rounded-xl aspect-[3/4] bg-surface-container-low center-child flex-col p-6 hover:(bg-white shadow-xs) transition-all duration-500"
    >
      <div
        v-if="icon"
        class="w-16 h-16 rounded-full bg-[#fdf2f2] center-child mb-4 group-hover:scale-110 transition-transform"
      >
        <span class="material-symbols-outlined text-primary text-3xl">{{ icon }}</span>
      </div>
      <h3 class="font-bold mb-1 text-center">{{ category.name }}</h3>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { TExistedCategory } from "~/types/category.type";

const props = defineProps<{
  category: TExistedCategory;
  index?: number;
}>();

const icon = computed(() => {
  switch (props.index) {
    case 0:
      return "diamond";
    case 1:
      return "forest";
    case 2:
      return "water_drop";
    case 3:
      return "local_fire_department";
    case 4:
      return "landscape";
  }
});
</script>
