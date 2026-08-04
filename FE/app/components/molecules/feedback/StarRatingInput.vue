<template>
  <div class="flex flex-wrap items-center gap-3">
    <div class="flex items-center gap-1">
      <button
        v-for="star in 5"
        :key="star"
        type="button"
        class="rounded-full p-1 transition-transform active:scale-95 disabled:cursor-not-allowed bg-transparent cursor-pointer"
        :disabled="disabled"
        :aria-label="`Chọn ${star} sao`"
        @click="handleSelect(star)"
      >
        <Star
          class="size-6"
          :class="star <= currentValue ? 'text-amber-500' : 'text-stone-300'"
          :fill="star <= currentValue ? 'currentColor' : 'none'"
        />
      </button>
    </div>

    <AtomsButton
      v-if="currentValue"
      type="ghost"
      class="text-sm font-medium text-stone-500 underline underline-offset-3 disabled:cursor-not-allowed"
      :disabled="disabled"
      @click="handleSelect(0)"
    >
      Bỏ chọn
    </AtomsButton>
  </div>
</template>

<script setup lang="ts">
import { Star } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    modelValue?: number;
    disabled?: boolean;
  }>(),
  {
    modelValue: 0,
    disabled: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: number];
}>();

const currentValue = computed(() => {
  const value = Number(props.modelValue);
  return Number.isFinite(value) ? Math.min(5, Math.max(0, value)) : 0;
});

const handleSelect = (value: number) => {
  emit("update:modelValue", value);
};
</script>
