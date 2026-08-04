<template>
  <div
    v-if="items.length"
    class="strip-track flex items-stretch gap-2 overflow-x-auto bg-surface-container-low/60 px-3 py-2.5 scrollbar-none md:(rounded-xl bg-surface-container-low/40) lg:(gap-3 px-4 py-3.5)"
  >
    <button
      type="button"
      class="strip-item strip-item--idle shrink-0 cursor-pointer rounded-lg bg-surface-container-highest p-0.5 lg:(rounded-xl p-1)"
      aria-label="Xem tất cả ảnh"
      @click="emit('open-gallery')"
    >
      <div class="relative h-12 w-12 overflow-hidden rounded-md bg-white lg:(h-16 w-16 rounded-lg)">
        <AtomsUiImageWithFallback
          :src="galleryPreviewImage"
          alt=""
          :width="48"
          :height="48"
          format="webp"
          img-class="h-full w-full object-cover"
        />
        <span
          class="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium tracking-wide text-white"
        >
          Ảnh
        </span>
      </div>
    </button>

    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      class="strip-item shrink-0 cursor-pointer rounded-lg bg-surface-container-highest p-0.5 text-left lg:(rounded-xl p-1)"
      :class="[
        isItemActive(item) ? 'strip-item--active' : 'strip-item--idle',
        item.option
          ? 'flex min-w-[7.5rem] max-w-[10rem] items-center gap-2.5 pr-2 lg:(min-w-[10rem] max-w-[13rem] gap-3 pr-2.5)'
          : '',
      ]"
      @click="emit('select', item)"
    >
      <div
        class="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-white lg:(h-16 w-16 rounded-lg)"
      >
        <AtomsUiImageWithFallback
          :src="item.imageUrl"
          alt=""
          :width="48"
          :height="48"
          format="webp"
          loading="lazy"
          img-class="h-full w-full object-cover"
        />
      </div>
      <div v-if="item.option" class="min-w-0 flex-1">
        <p class="truncate text-xs font-medium leading-snug text-on-surface lg:text-sm">
          {{ getStripLabels(item.option).primary }}
        </p>
        <p
          v-if="getStripLabels(item.option).secondary"
          class="truncate text-[11px] leading-snug text-on-surface-variant lg:text-xs"
        >
          {{ getStripLabels(item.option).secondary }}
        </p>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { TOptionValue } from "~/types/product.type";
import { getOptionValueId } from "~/composables/useProductOptionSelection";

export type TGalleryStripItem = {
  id: string;
  imageUrl: string;
  option?: TOptionValue;
};

const {
  items,
  selectedImage = "",
  activeOptionValueId = null,
  galleryPreviewImage = "",
  getStripLabels,
} = defineProps<{
  items: TGalleryStripItem[];
  selectedImage?: string;
  activeOptionValueId?: string | null;
  galleryPreviewImage?: string;
  getStripLabels: (option: TOptionValue) => { primary: string; secondary: string };
}>();

const emit = defineEmits<{
  (e: "select", item: TGalleryStripItem): void;
  (e: "open-gallery"): void;
}>();

const isItemActive = (item: TGalleryStripItem) => {
  if (selectedImage === item.imageUrl) return true;
  if (item.option && activeOptionValueId === getOptionValueId(item.option)) return true;
  return false;
};
</script>

<style scoped>
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}

.strip-item {
  box-shadow: 0 0 0 2px transparent;
}

.strip-item--idle {
  box-shadow: 0 0 0 2px rgb(0 0 0 / 8%);
}

.strip-item--idle:hover {
  box-shadow: 0 0 0 2px rgb(0 0 0 / 14%);
}

.strip-item--active {
  box-shadow: 0 0 0 2px var(--color-primary, #d85510);
}
</style>
