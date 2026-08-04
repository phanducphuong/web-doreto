<template>
  <div class="flex flex-wrap gap-3 items-center">
    <template v-for="filter in filters" :key="filter.key">
      <!-- Price -->
      <AtomsFormInput
        v-if="filter.type === 'price'"
        v-model="localValues[filter.key]"
        :placeholder="filter.placeholder || 'Nhập giá...'"
        :format="formatPrice"
        :parse="parsePrice"
        :error="formErrors?.[filter.key]"
        class="w-32"
      />

      <!-- Select -->
      <AtomsFormSelectBox
        v-else-if="filter.type === 'select'"
        v-model="localValues[filter.key]"
        :options="filter.options || []"
        :placeholder="filter.placeholder || 'Chọn...'"
        :error="formErrors?.[filter.key]"
        class="min-w-40"
      />

      <!-- Input -->
      <AtomsFormInput
        v-else-if="filter.type === 'input'"
        v-model="localValues[filter.key]"
        :placeholder="filter.placeholder || 'Tìm kiếm...'"
        :suffix-icon="Search"
        :error="formErrors?.[filter.key]"
        class="min-w-48"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from "vue";
import { Search } from "lucide-vue-next";
import { formatPrice, parsePrice } from "~/utils/data.utils";

type FilterOption = {
  label: string;
  value: string | number;
};

export type FilterConfig = {
  type: "input" | "select" | "price";
  key: string;
  placeholder?: string;
  options?: FilterOption[];
};

const props = defineProps<{
  filters: FilterConfig[];
  modelValue?: Record<string, any>;
  formErrors?: Record<string, string>;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: Record<string, any>): void;
}>();

/**
 * 👉 Local state (để debounce)
 */
const localValues = ref<Record<string, any>>({
  ...(props.modelValue || {}),
});

/**
 * 👉 Helper: compare object (tránh loop)
 */
const isSame = (a: any, b: any) => {
  return JSON.stringify(a || {}) === JSON.stringify(b || {});
};

/**
 * 👉 Sync từ ngoài vào (có guard tránh loop)
 */
watch(
  () => props.modelValue,
  (val) => {
    if (!isSame(val, localValues.value)) {
      localValues.value = { ...(val || {}) };
    }
  },
  { deep: true },
);

/**
 * 👉 Debounce timers theo field
 */
const debounceTimers: Record<string, any> = {};

/**
 * 👉 Emit an toàn (tránh emit trùng)
 */
const emitIfChanged = (key: string, value: any) => {
  if (props.modelValue?.[key] === value) return;

  emit("update:modelValue", {
    ...props.modelValue,
    [key]: value,
  });
};

/**
 * 👉 Watch từng field riêng (QUAN TRỌNG)
 */
props.filters.forEach((filter) => {
  watch(
    () => localValues.value[filter.key],
    (value) => {
      // ✅ select → emit ngay
      if (filter.type === "select") {
        emitIfChanged(filter.key, value);
        return;
      }

      // ✅ input + price → debounce
      clearTimeout(debounceTimers[filter.key]);

      debounceTimers[filter.key] = setTimeout(() => {
        emitIfChanged(filter.key, value);
      }, 300);
    },
  );
});

/**
 * 👉 Cleanup
 */
onBeforeUnmount(() => {
  Object.values(debounceTimers).forEach(clearTimeout);
});
</script>
