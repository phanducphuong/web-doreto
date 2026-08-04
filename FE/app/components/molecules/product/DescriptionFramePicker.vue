<template>
  <div class="space-y-2">
    <p v-if="loading" class="text-sm text-on-surface-variant">Đang tải khung ảnh...</p>

    <div v-else class="flex flex-wrap gap-3">
      <button
        type="button"
        class="group relative h-24 w-24 overflow-hidden rounded-xl border-2 transition-all"
        :class="
          modelValue == null
            ? 'border-primary ring-2 ring-primary/30'
            : 'border-outline-variant hover:border-primary/50'
        "
        :disabled="disabled"
        @click="selectFrame(null)"
      >
        <div
          class="flex h-full w-full items-center justify-center bg-surface-container-low text-xs text-on-surface-variant"
        >
          Không khung
        </div>
      </button>

      <button
        v-for="frame in frames"
        :key="frame._id"
        type="button"
        class="group relative h-24 w-24 overflow-hidden rounded-xl border-2 transition-all"
        :class="
          modelValue === frame._id
            ? 'border-primary ring-2 ring-primary/30'
            : 'border-outline-variant hover:border-primary/50'
        "
        :disabled="disabled"
        :title="frame.name"
        @click="selectFrame(frame._id)"
      >
        <img
          :src="frame.imageUrl"
          :alt="frame.name"
          class="h-full w-full object-contain bg-surface-container-low p-1"
        />
        <span
          class="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1 py-0.5 text-[10px] text-white"
        >
          {{ frame.name }}
        </span>
      </button>
    </div>

    <p v-if="!loading && !frames.length" class="text-sm text-on-surface-variant">
      Chưa có khung ảnh. Tạo khung tại trang quản lý khung ảnh.
    </p>
  </div>
</template>

<script setup lang="ts">
import type { TActiveImageFrame } from "~/types/image-frame.type";

const props = withDefaults(
  defineProps<{
    modelValue?: number | null;
    frames: TActiveImageFrame[];
    loading?: boolean;
    disabled?: boolean;
  }>(),
  {
    modelValue: null,
    loading: false,
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: number | null): void;
}>();

const selectFrame = (frameId: number | null) => {
  if (props.disabled) return;
  emit("update:modelValue", frameId);
};
</script>
