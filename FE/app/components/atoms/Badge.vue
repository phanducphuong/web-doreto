<template>
  <span :class="badgeClass">
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup lang="ts">
import type { TBadgeType } from "~/utils/purchase-order.utils";

const props = withDefaults(
  defineProps<{
    type?: TBadgeType;
    label?: string;
  }>(),
  {
    type: "default",
    label: "",
  },
);

const badgeClass = computed(() => {
  const baseClass = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
  const typeClassMap: Record<TBadgeType, string> = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    error: "bg-red-100 text-red-700",
    warning: "bg-amber-100 text-amber-700",
    info: "text-white-fixed-variant bg-tertiary-fixed",
    neutral: "bg-violet-100 text-violet-700",
  };

  return `${baseClass} ${typeClassMap[props.type]}`;
});
</script>
