<template>
  <div
    :class="[
      'w-full rounded-4 border px-3 py-2 bg-white transition-colors',
      {
        'border-danger focus-within:ring-1 focus-within:ring-danger': error,
        'border-third-light focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary':
          !error,
        'bg-gray-100 cursor-not-allowed opacity-60': disabled,
      },
    ]"
  >
    <textarea
      :id="inputId"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :maxlength="maxlength"
      :rows="rows"
      class="w-full bg-transparent outline-none text-sm text-gray-800 placeholder:text-third-light disabled:cursor-not-allowed resize-y"
      v-bind="$attrs"
      @input="onInput"
      @blur="emit('blur', $event)"
      @focus="emit('focus', $event)"
    />
  </div>
</template>

<script lang="ts" setup>
import { useId } from "vue";

defineOptions({ inheritAttrs: false });

const {
  modelValue = "",
  placeholder,
  disabled = false,
  required = false,
  maxlength,
  rows = 4,
} = defineProps<{
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  maxlength?: number;
  rows?: number;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "blur", event: FocusEvent): void;
  (e: "focus", event: FocusEvent): void;
}>();

const inputId = useId();

const onInput = (event: Event) => {
  emit("update:modelValue", (event.target as HTMLTextAreaElement).value);
};
</script>
