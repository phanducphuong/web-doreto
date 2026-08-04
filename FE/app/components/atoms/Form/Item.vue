<template>
  <div class="space-y-1 text-sm">
    <p v-if="label" class="font-medium" :class="classLabel">
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </p>

    <slot></slot>

    <p v-if="errorMessage" class="text-danger text-sm">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
const { label, required, errorMessage } = defineProps<{
  label?: string;
  required?: boolean;
  errorMessage?: string | undefined;
  classLabel?: string;
}>();
</script>
