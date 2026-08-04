<template>
  <div class="flex items-center gap-2 font-medium text-xs">
    <template v-for="(breadcrumb, index) in breadcrumbs" :key="breadcrumb.label">
      <component
        :is="breadcrumb.to ? NuxtLink : 'span'"
        :to="breadcrumb.to"
        class="uppercase"
        :class="{
          'text-neutral/80': breadcrumb.disabled,
          'text-on-surface cursor-default': index === breadcrumbs.length - 1,
          'hover:text-primary transition-colors': breadcrumb.to,
        }"
      >
        {{ breadcrumb.label }}
      </component>

      <span v-if="index < breadcrumbs.length - 1">/</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { NuxtLink } from "#components";
import type { TBreadcrumb } from "~/types/base.type";
const { breadcrumbs } = defineProps<{
  breadcrumbs: TBreadcrumb[];
}>();
</script>
