<template>
  <div
    :class="[
      'flex h-11 items-center gap-2 overflow-hidden rounded-xl border bg-white px-3 py-2 text-sm transition-all',
      {
        'border-danger focus-within:border-danger focus-within:ring-(2 danger/20)': error,
        'border-outline-variant focus-within:border-primary focus-within:ring-(2 primary/20)':
          !error,
        'cursor-not-allowed bg-surface-container opacity-70': $attrs.disabled,
      },
      attrs.class,
    ]"
  >
    <!-- * PREFIX ICON -->
    <component v-if="prefixIcon" :is="prefixIcon" class="size-4 shrink-0 text-on-surface-variant" />

    <input
      :id="inputId"
      :value="displayValue"
      class="w-full min-w-0 bg-transparent text-sm text-on-surface outline-none placeholder:text-outline disabled:cursor-not-allowed"
      :class="inputClass"
      v-bind="inputAttrs"
      @input="onInput"
      @blur="emit('blur', $event)"
      @focus="emit('focus', $event)"
    />

    <!-- * SUFFIX ICON / CLEAR BUTTON -->
    <button
      v-if="clearable && modelValue"
      type="button"
      class="shrink-0 rounded-full p-0.5 text-on-surface-variant transition-colors hover:(bg-surface-variant text-primary)"
      @click="emit('update:modelValue', '')"
    >
      <X class="size-4" />
    </button>
    <component
      v-else-if="suffixIcon"
      :is="suffixIcon"
      class="size-4 shrink-0 text-on-surface-variant"
    />
  </div>
</template>

<script lang="ts" setup>
import { X } from "lucide-vue-next";
import { useId, useAttrs, computed } from "vue";

const attrs = useAttrs();

const inputAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs;
  return rest;
});

const props = withDefaults(
  defineProps<{
    modelValue?: string | number;
    error?: string;
    clearable?: boolean;
    prefixIcon?: Component;
    suffixIcon?: Component;
    format?: (value: string) => string;
    parse?: (value: string) => string | number;
    inputClass?: string;
  }>(),
  {
    modelValue: "",
    clearable: false,
    type: "text",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string | number): void;
  (e: "blur", event: FocusEvent): void;
  (e: "focus", event: FocusEvent): void;
}>();

const inputId = useId();

/**
 * 👉 Giá trị hiển thị (format nếu có)
 */
const displayValue = computed(() => {
  const value = String(props.modelValue ?? "");
  return props.format ? props.format(value) : value;
});

/**
 * 👉 Handle input
 */
const onInput = (event: Event) => {
  let value = (event.target as HTMLInputElement).value;

  // parse nếu có
  if (props.parse) {
    value = props.parse(value) as any;
  }

  // nếu type = number → convert number
  if (inputAttrs.value.type === "number") {
    const num = Number(value);
    emit("update:modelValue", isNaN(num) ? 0 : num);
    return;
  }

  emit("update:modelValue", value);
};
</script>
