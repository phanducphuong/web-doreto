<template>
  <p
    v-if="message"
    class="rounded-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700"
  >
    {{ message }}
  </p>
</template>

<script setup lang="ts">
defineProps<{
  message?: string;
}>();
</script>
