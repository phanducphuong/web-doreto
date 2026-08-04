<template>
  <div class="mt-4 flex flex-col gap-2 rounded-xl bg-[#f7f3f2] p-4 sm:(mt-5 gap-3 p-6) lg:(mt-6 p-8)">
    <span class="flex w-full items-center gap-2 text-xl font-bold text-slate-900 sm:text-2xl">
      <TicketPercent class="size-5 sm:size-6" />
      Mã giảm giá
    </span>
    <div class="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 lg:gap-4">
      <AtomsFormInput
        :model-value="modelValue"
        placeholder="Nhập mã giảm giá"
        class="w-full !h-10 rounded-none border-(b-2 transparent) bg-white !ring-none focus:border-primary/10 sm:!h-11"
        input-class="!text-base sm:!text-lg"
        @update:model-value="onUpdateValue"
      />
      <AtomsButton
        type="quaternary"
        class="h-unset w-full shrink-0 whitespace-nowrap !px-5 !py-2.5 text-sm sm:(w-auto !h-10 !px-6 !py-0 text-base) lg:text-lg"
        @click="$emit('apply')"
      >
        Áp dụng
      </AtomsButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TicketPercent } from "lucide-vue-next";

defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "apply"): void;
}>();

const onUpdateValue = (value: string | number) => {
  emit("update:modelValue", String(value ?? ""));
};
</script>
