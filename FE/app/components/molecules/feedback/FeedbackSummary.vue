<template>
  <section class="text-on-surface text-base sm:text-lg lg:text-3xl">
    <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="font-semibold">Đánh giá của khách hàng ({{ summary.ratingCount }})</p>
        <div class="flex items-baseline">
          <span class="text-lg font-semibold text-stone-950 sm:text-4xl">
            {{ displayAverage }}</span
          >
          <span class="text-stone-500 ml-1 text-sm">/5</span>
          <AtomsUiRating :rating="summary.averageRating" :truncate="false" class="ml-2" />
        </div>
      </div>

      <div
        v-if="isLoading"
        class="rounded-5 bg-stone-100 px-3 py-2 text-xs leading-5 text-stone-600 sm:(px-4 py-3 text-sm leading-6) md:max-w-88"
      >
        Đang tải số liệu đánh giá...
      </div>
    </div>

    <AtomsUiInlineError class="mt-4" :message="error" />
  </section>
</template>

<script setup lang="ts">
import type { TFeedbackSummary } from "~/types/feedback.type";

const props = withDefaults(
  defineProps<{
    summary: TFeedbackSummary;
    isLoading?: boolean;
    error?: string;
  }>(),
  {
    isLoading: false,
    error: "",
  },
);

const displayAverage = computed(() => {
  const rating = Number(props.summary.averageRating || 0);
  return rating % 1 === 0 ? rating.toFixed(0) : rating.toFixed(1);
});
</script>
