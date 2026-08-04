<template>
  <div
    :class="[
      'flex min-h-11 items-center gap-2 overflow-hidden rounded-xl border bg-white px-3 py-2 text-sm transition-all',
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

    <!-- TAG LIST -->
    <div class="flex flex-1 flex-wrap items-center gap-1.5 min-w-0">
      <AtomsBadge
        v-for="item in modelValue"
        type="info"
        :key="item"
        class="flex items-center gap-2"
      >
        {{ item }}
        <button
          v-if="!disabled"
          class="center-child hover:scale-110 cursor-pointer bg-transparent text-danger"
          @click.stop="removeTag(item)"
        >
          <X class="size-3" />
        </button>
      </AtomsBadge>

      <!-- INPUT -->
      <input
        v-model="inputValue"
        class="h-6 min-w-[110px] flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-outline disabled:cursor-not-allowed"
        :placeholder="placeholder"
        :disabled="disabled"
        @keyup.enter.prevent="onEnterKey"
        @blur="addTagFromBlur"
      />
    </div>

    <!-- CLEAR ALL -->
    <button
      v-if="clearable && modelValue.length"
      type="button"
      class="shrink-0 rounded-full p-0.5 text-on-surface-variant transition-colors hover:(bg-surface-variant text-primary)"
      :disabled="disabled"
      @click="clearAll"
    >
      <X class="size-4" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { X } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    modelValue: string[];
    clearable?: boolean;
    prefixIcon?: any;
    error?: string;
    disabled?: boolean;
    placeholder?: string;
    maxTags?: number;
  }>(),
  {
    clearable: true,
    placeholder: "Nhập rồi nhấn Enter...",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string[]): void;
}>();

const inputValue = ref("");
const skipNextBlur = ref(false);
/** Tránh double-fire: IME (isComposing / 229), hoặc một số trình duyệt bắn 2 sự kiện gần nhau */
let lastEnterHandledAt = 0;

// ✅ Add tag
const addTag = () => {
  if (props.disabled) return;

  const value = inputValue.value.trim();
  if (!value) return;

  // limit
  if (props.maxTags && props.modelValue.length >= props.maxTags) return;

  // tránh duplicate
  if (!props.modelValue.includes(value)) {
    emit("update:modelValue", [...props.modelValue, value]);
  }

  inputValue.value = "";
};

const onEnterKey = (e: KeyboardEvent) => {
  e.stopPropagation();
  if (e.isComposing || (e as KeyboardEvent & { keyCode?: number }).keyCode === 229) return;
  const now = performance.now();
  if (now - lastEnterHandledAt < 200) return;
  lastEnterHandledAt = now;
  skipNextBlur.value = true;
  addTag();
};

const addTagFromBlur = () => {
  if (skipNextBlur.value) {
    skipNextBlur.value = false;
    return;
  }
  addTag();
};

// ✅ Remove
const removeTag = (tag: string) => {
  emit(
    "update:modelValue",
    props.modelValue.filter((t) => t !== tag),
  );
};

// ✅ Clear all
const clearAll = () => {
  emit("update:modelValue", []);
};
</script>
