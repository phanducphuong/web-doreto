<template>
  <div
    class="rounded-6 border border-dashed border-stone-300 bg-stone-50 px-4 py-7 text-center sm:(px-6 py-10)"
  >
    <h3 class="text-base font-semibold text-stone-900 sm:text-lg">{{ title }}</h3>
    <p
      v-if="description"
      class="mx-auto mt-2 max-w-96 text-xs leading-5 rgb(87 83 78) sm:(text-sm leading-6)"
    >
      {{ description }}
    </p>
    <div v-if="$slots.default" class="mt-3 sm:mt-4">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    description?: string;
  }>(),
  {
    description: "",
  },
);
</script>
