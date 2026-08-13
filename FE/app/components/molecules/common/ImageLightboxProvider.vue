<template>
  <span class="hidden" aria-hidden="true" />
</template>

<script setup lang="ts">
import type { TImageLightboxPayload } from "~/types/image-lightbox.type";

const { $listen, $off } = useNuxtApp();
const { openImageLightbox } = useImageLightbox();

const onOpen = (payload: TImageLightboxPayload) => {
  void openImageLightbox(payload);
};

onMounted(() => {
  $listen("image-lightbox:open", onOpen);
});
onUnmounted(() => {
  $off("image-lightbox:open", onOpen);
});
</script>
