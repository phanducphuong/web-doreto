<template>
  <div class="flex items-center gap-1 text-xs sm:text-sm" :aria-label="`Đánh giá ${displayRating} trên 5`">
    <template v-if="truncate">
      <Star class="size-3.5 text-amber-500 sm:size-4" fill="currentColor" />
      <span class="mt-0.5 font-medium text-amber-500">{{ displayRating }}</span>
    </template>
    <template v-else>
      <Star
        v-for="i in 5"
        :key="i"
        class="mx-0.5 size-3.5 shrink-0 sm:size-4"
        :class="i <= filledStars ? 'text-amber-500' : 'text-third-light'"
        :fill="i <= filledStars ? 'currentColor' : 'none'"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { Star } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    rating?: number;
    truncate?: boolean;
  }>(),
  { truncate: true },
);

const displayRating = computed(() => {
  const r = Number(props.rating);
  if (!Number.isFinite(r)) return 0;
  return Math.min(5, Math.max(0, r));
});

const filledStars = computed(() => Math.round(displayRating.value));
</script>
