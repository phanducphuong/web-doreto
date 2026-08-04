<template>
  <span class="hidden" aria-hidden="true" />
</template>

<script setup lang="ts">
import type { TImageLightboxPayload } from "~/types/image-lightbox.type";

const { $listen } = useNuxtApp();
const { openImageLightbox } = useImageLightbox();

onMounted(() => {
  $listen("image-lightbox:open", (payload: TImageLightboxPayload) => {
    void openImageLightbox(payload);
  });
});
</script>
