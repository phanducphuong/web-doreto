<template>
  <button
    type="button"
    :disabled="isLoading || disabled"
    :class="[
      'p-(y-2 x-4) cursor-pointer center-child gap-2 h-9 text-sm disabled:opacity-50 disabled:cursor-not-allowed',
      circle ? 'rounded-full' : 'rounded-xl',
      {
        'bg-primary text-white hover:brightness-110 ': type === 'primary',
        'bg-secondary text-white hover:brightness-110': type === 'secondary',
        'bg-tertiary text-white hover:bg-white-fixed-variant': type === 'quaternary',
        'bg-danger text-white hover:brightness-110': type === 'danger',
        'bg-transparent hover:bg-third-light/10': type === 'ghost',
        'border-base bg-white hover:bg-third-light/10': type === 'outline',
        'text-primary lg:hover:underline bg-transparent': type === 'link',
        'center-child gradient-primary text-white rounded-xl shadow-(lg primary/20) hover:(shadow-xl primary/30 brightness-110) transition-all active:scale-95 cursor-pointer':
          type == 'primaryGradient',
      },
    ]"
  >
    <!-- * ICON -->
    <LoaderCircle v-if="isLoading" class="animate-spin size-4 shrink-0" />
    <component v-else-if="icon" :is="icon" class="size-4 shrink-0" />

    <!-- * CONTENT -->
    <slot />
  </button>
</template>

<script lang="ts" setup>
type TButtonType =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "outline"
  | "quaternary"
  | "link"
  | "primaryGradient";
import { LoaderCircle } from "lucide-vue-next";

const {
  isLoading,
  disabled,
  type = "primary",
  circle = false,
  icon = undefined,
} = defineProps<{
  isLoading?: boolean;
  disabled?: boolean;
  type?: TButtonType;
  icon?: Component;
  circle?: boolean;
}>();
</script>
