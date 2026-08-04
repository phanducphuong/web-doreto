<template>
  <figure v-if="frame?.imageUrl" class="desc-framed-image desc-framed-image--inset-preview">
    <img
      class="desc-framed-image__frame-sizer"
      :src="frame.imageUrl"
      alt=""
      aria-hidden="true"
    />
    <img
      class="desc-framed-image__frame"
      :src="frame.imageUrl"
      alt=""
      aria-hidden="true"
    />
    <div class="desc-framed-image__photo-wrap" :style="wrapPaddingStyle">
      <div class="desc-framed-image__placeholder">Ảnh gốc</div>
    </div>
  </figure>
</template>

<script setup lang="ts">
import type { TActiveImageFrame } from "~/types/image-frame.type";
import { getFrameWrapPaddingStyle } from "~/utils/image-frame.utils";

const props = defineProps<{
  frame: TActiveImageFrame | null;
}>();

const wrapPaddingStyle = computed(() =>
  props.frame ? getFrameWrapPaddingStyle(props.frame) : {},
);
</script>
