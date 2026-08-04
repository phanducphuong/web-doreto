<template>
  <div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
    <p class="text-xs font-semibold text-third-dark sm:text-sm">Page {{ page }} of {{ totalPage }}</p>

    <div class="flex w-full items-center justify-end gap-1 sm:w-auto">
      <AtomsButton
        type="outline"
        :icon="ChevronLeft"
        :disabled="page <= 1 || totalPage < 1"
        class="!h-7 !min-w-7 !rounded-lg !px-0 border-surface-variant text-third-dark hover:(text-primary border-primary) disabled:(cursor-not-allowed opacity-45) sm:(!h-8 !min-w-8)"
        aria-label="Trang trước"
        @click="goToPage(page - 1)"
      />

      <template
        v-for="(item, idx) in visiblePages"
        :key="item === 'ellipsis' ? `e-${idx}` : String(item)"
      >
        <span
          v-if="item === 'ellipsis'"
          class="min-w-7 select-none text-center text-xs leading-none text-third-light sm:(min-w-8 text-sm)"
        >
          …
        </span>
        <AtomsButton
          v-else
          :type="item === page ? 'danger' : 'outline'"
          class="!h-7 !min-w-7 !rounded-lg !px-0 text-xs font-semibold leading-none sm:(!h-8 !min-w-8 text-sm)"
          :class="
            item === page
              ? 'bg-primary hover:bg-primary-container/95 text-white border-transparent'
              : 'border-surface-variant text-third-light hover:(text-primary border-primary)'
          "
          :aria-current="item === page ? 'page' : undefined"
          :aria-label="`Trang ${item}`"
          @click="goToPage(item)"
        >
          {{ item }}
        </AtomsButton>
      </template>

      <AtomsButton
        type="outline"
        :icon="ChevronRight"
        :disabled="page >= totalPage || totalPage < 1"
        class="!h-7 !min-w-7 !rounded-lg !px-0 border-surface-variant text-third-dark hover:(text-primary border-primary) disabled:(cursor-not-allowed opacity-45) sm:(!h-8 !min-w-8)"
        aria-label="Trang sau"
        @click="goToPage(page + 1)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import AtomsButton from "~/components/atoms/Button.vue";

type TPaginationProps = {
  page: number;
  total: number;
  limit?: number;
};

const { page, total, limit = 1 } = defineProps<TPaginationProps>();

const emit = defineEmits<{
  (e: "change", page: number): void;
}>();

const totalPage = computed(() => {
  const safeLimit = limit > 0 ? limit : 1;
  return Math.ceil(total / safeLimit);
});

const visiblePages = computed((): Array<number | "ellipsis"> => {
  const totalPages = totalPage.value;
  if (totalPages < 1) return [];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const showEllipsisStart = page > 4;
  const showEllipsisEnd = page < totalPages - 3;

  const items: Array<number | "ellipsis"> = [1];

  if (showEllipsisStart) {
    items.push("ellipsis");
  }

  const start = showEllipsisStart ? Math.max(2, page - 1) : 2;
  const end = showEllipsisEnd ? Math.min(totalPages - 1, page + 1) : totalPages - 1;

  for (let i = start; i <= end; i++) {
    items.push(i);
  }

  if (showEllipsisEnd) {
    items.push("ellipsis");
  }

  if (totalPages > 1) {
    items.push(totalPages);
  }

  return items;
});

const goToPage = (next: number) => {
  if (next < 1 || next > totalPage.value || totalPage.value < 1) return;
  emit("change", next);
};
</script>
