<template>
  <div class="relative overflow-hidden !transition-none" :class="imgClass" @click="emit('click')">
    <!-- src rỗng (chưa có ảnh) → hiện placeholder, KHÔNG phải ảnh lỗi -->
    <img
      v-if="isEmpty"
      :src="placeholderSrc"
      :alt="`${resolvedAlt}-placeholder`"
      :width="width"
      :height="height"
      :class="imgClass"
      class="max-w-full max-h-full object-cover"
    />

    <!-- Ảnh lỗi thật → thẻ <img> thuần, không qua NuxtImg/_ipx (nếu _ipx chết thì fallback vẫn hiện được) -->
    <img
      v-else-if="hasError"
      :src="errorSrc"
      :alt="`${resolvedAlt}-error`"
      :width="width"
      :height="height"
      :class="imgClass"
      class="max-w-full max-h-full object-cover"
    />

    <template v-else>
      <img
        v-show="showPlaceholder"
        :src="placeholderSrc"
        :alt="`${resolvedAlt}-placeholder`"
        :class="imgClass"
        :width="width"
        :height="height"
        class="absolute inset-0 max-w-full max-h-full object-cover"
      />

      <NuxtImg
        v-if="isNuxtImage"
        ref="realImageRef"
        :src="src"
        :width="width"
        :height="height"
        :format="format"
        :alt="resolvedAlt"
        :class="['max-w-full max-h-full object-cover', imgClass, imageVisibilityClass]"
        :loading="loading"
        @load="handleLoad"
        @error="handleError"
      />
      <img
        v-else
        ref="realImageRef"
        :src="src"
        :alt="resolvedAlt"
        :width="width"
        :height="height"
        :class="['max-w-full max-h-full object-cover', imgClass, imageVisibilityClass]"
        :loading="loading"
        @load="handleLoad"
        @error="handleError"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

defineOptions({
  inheritAttrs: false,
});

const emit = defineEmits<{
  (event: "click"): void;
}>();

const props = withDefaults(
  defineProps<{
    src?: string;
    alt?: string;
    isNuxtImage?: boolean;
    placeholderSrc?: string;
    errorSrc?: string;
    imgClass?: string;
    width?: number | string;
    height?: number | string;
    format?: "webp" | "png" | "jpg" | "jpeg" | "gif" | "svg";
    loading?: "lazy" | "eager";
  }>(),
  {
    src: "",
    alt: "image",
    isNuxtImage: true,
    placeholderSrc: "/product-placeholder.webp",
    errorSrc: "/error-image.png",
    imgClass: "",
    width: 0,
    height: 0,
    format: "webp",
    loading: "lazy",
  },
);

const isHydrated = ref(false);
const isLoading = ref(true);
const hasError = ref(false);
const realImageRef = ref<HTMLImageElement | { $el?: HTMLImageElement } | null>(null);

const resolvedAlt = computed(() => props.alt || "image");
const isEmpty = computed(() => !props.src?.trim());
const showPlaceholder = computed(() => !isHydrated.value || (isLoading.value && !hasError.value));
const imageVisibilityClass = computed(() => (showPlaceholder.value ? "opacity-0" : "opacity-100"));

const getRealImageEl = (): HTMLImageElement | null => {
  const target = realImageRef.value as any;
  const el = target?.$el ?? target;
  return el instanceof HTMLImageElement ? el : null;
};

/**
 * Đồng bộ trạng thái với thẻ <img> thật, KHÔNG tải trước ảnh bằng request riêng.
 * (Trước đây mỗi ảnh đều bị "probe" tải ngay khi vào trang, khiến loading="lazy"
 * vô tác dụng và mọi ảnh trên trang tải cùng lúc gây lag.)
 * - Ảnh đã tải xong trước khi hydrate (SSR + cache): complete = true → tắt placeholder ngay.
 * - Ảnh lazy chưa vào màn hình: giữ placeholder, chờ sự kiện load/error của chính thẻ img.
 */
const syncWithRealImage = () => {
  if (!import.meta.client) return;

  // src rỗng → hiện placeholder (trạng thái "chưa có ảnh"), không phải lỗi
  if (isEmpty.value) {
    hasError.value = false;
    isLoading.value = false;
    return;
  }

  const el = getRealImageEl();
  if (el && el.complete) {
    if (el.naturalWidth > 0) {
      isLoading.value = false;
      hasError.value = false;
    } else if (el.loading !== "lazy") {
      // Ảnh eager đã kết thúc tải nhưng không có dữ liệu → coi là lỗi
      hasError.value = true;
      isLoading.value = false;
    }
  }
};

watch(
  () => props.src,
  () => {
    hasError.value = false;
    isLoading.value = true;
    if (isEmpty.value) {
      isLoading.value = false;
      return;
    }
    nextTick(syncWithRealImage);
  },
  { immediate: true },
);

const handleLoad = () => {
  isLoading.value = false;
};

const handleError = () => {
  if (hasError.value) {
    return;
  }
  hasError.value = true;
  isLoading.value = false;
};

onMounted(() => {
  isHydrated.value = true;
  syncWithRealImage();
});
</script>
