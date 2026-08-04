<template>
  <div
    ref="elementRef"
    :class="[
      'relative flex min-h-11 flex-wrap items-center gap-2 rounded-xl border bg-white p-(x-3 y-2) text-sm transition-all cursor-pointer',
      {
        'border-danger focus-within:border-danger focus-within:ring-(2 danger/20)': error,
        'border-outline-variant focus-within:border-primary focus-within:ring-(2 primary/20)':
          !error,
        'cursor-not-allowed bg-surface-container opacity-70': disabled,
      },
    ]"
  >
    <!-- PREFIX ICON -->
    <component v-if="prefixIcon" :is="prefixIcon" class="size-4 shrink-0 text-on-surface-variant" />

    <!-- SELECT DISPLAY -->
    <div class="flex flex-wrap items-center gap-1 flex-1 min-w-0">
      <!-- MULTIPLE -->
      <template v-if="isMultiple">
        <AtomsBadge
          v-for="item in selectedOptions"
          :key="item.value"
          type="info"
          class="flex items-center gap-2"
        >
          {{ item.label }}
          <button
            v-if="!disabled"
            class="center-child hover:scale-110 cursor-pointer bg-transparent text-danger"
            @click.stop="removeOption(item.value)"
          >
            <X class="size-3" />
          </button>
        </AtomsBadge>

        <input
          v-model="search"
          :disabled="disabled"
          class="min-w-[60px] flex-1 bg-transparent text-xs text-on-surface outline-none placeholder:text-outline"
          :placeholder="placeholder"
          @focus="openDropdown"
        />
      </template>

      <!-- SINGLE -->
      <template v-else>
        <input
          readonly
          :value="selectedOptions[0]?.label || ''"
          class="w-full cursor-pointer bg-transparent text-xs text-on-surface outline-none placeholder:text-outline"
          :placeholder="placeholder"
          @click="openDropdown"
        />
      </template>
    </div>

    <!-- CLEAR -->
    <AtomsButton
      v-if="clearable && hasValue && !disabled"
      type="ghost"
      class="!w-6 !h-6"
      circle
      :icon="X"
      @click="clearAll"
    />

    <!-- DROPDOWN ICON -->
    <ChevronDown class="size-4 shrink-0 cursor-pointer text-on-surface-variant" @click="toggle" />

    <!-- DROPDOWN -->
    <div
      v-if="open"
      class="absolute left-0 top-full z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-outline-variant bg-white p-2 shadow-lg"
    >
      <div
        v-for="opt in filteredOptions"
        :key="opt.value"
        class="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-on-surface transition-colors hover:bg-surface-container-low"
        @click="selectOption(opt)"
      >
        <span>{{ opt.label }}</span>
        <Check v-if="isSelected(opt.value)" class="size-4 text-primary" />
      </div>

      <div v-if="!filteredOptions.length" class="px-3 py-2 text-xs text-outline">
        Không có dữ liệu
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { X, ChevronDown, Check } from "lucide-vue-next";
import { useClickOutside } from "~/composables/clickOutside.composable";

type Option = {
  label: string;
  value: string | number;
};

const props = withDefaults(
  defineProps<{
    modelValue: any | any[];
    options: Option[];
    isMultiple?: boolean;
    clearable?: boolean;
    prefixIcon?: any;
    error?: string;
    disabled?: boolean;
    placeholder?: string;
  }>(),
  {
    isMultiple: false,
    clearable: true,
    placeholder: "Chọn",
  },
);

const emit = defineEmits(["update:modelValue"]);

const open = ref(false);
const search = ref("");

// click outside
const { elementRef } = useClickOutside(() => {
  open.value = false;
});

const openDropdown = () => {
  if (props.disabled) return;
  open.value = true;
};

const toggle = () => {
  if (props.disabled) return;
  open.value = !open.value;
};

// ✅ normalize value (FIX NESTED ARRAY)
const normalizedValue = computed(() => {
  if (props.isMultiple) {
    return Array.isArray(props.modelValue) ? props.modelValue.flat() : [];
  }
  return props.modelValue;
});

const isSelected = (value: any) => {
  if (props.isMultiple) {
    return (normalizedValue.value as any[]).includes(value);
  }
  return normalizedValue.value === value;
};

const selectedOptions = computed(() => {
  if (props.isMultiple) {
    return props.options.filter((o) => (normalizedValue.value as any[]).includes(o.value));
  }
  return props.options.filter((o) => o.value === normalizedValue.value);
});

const selectOption = (opt: Option) => {
  if (props.disabled) return;

  if (props.isMultiple) {
    let values = Array.isArray(normalizedValue.value) ? [...normalizedValue.value] : [];

    if (values.includes(opt.value)) {
      values = values.filter((v) => v !== opt.value);
    } else {
      values.push(opt.value);
    }

    emit("update:modelValue", values.flat());
  } else {
    emit("update:modelValue", opt.value);
    open.value = false;
  }
};

const removeOption = (value: any) => {
  if (props.disabled) return;

  const values = (normalizedValue.value as any[]).filter((v) => v !== value);
  emit("update:modelValue", values);
};

const clearAll = () => {
  emit("update:modelValue", props.isMultiple ? [] : "");
};

const hasValue = computed(() => {
  return props.isMultiple ? (normalizedValue.value as any[])?.length > 0 : !!normalizedValue.value;
});

const filteredOptions = computed(() => {
  if (!search.value) return props.options;

  return props.options.filter((o) => o.label.toLowerCase().includes(search.value.toLowerCase()));
});
</script>
