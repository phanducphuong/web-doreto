<template>
  <div class="space-y-2.5 sm:space-y-3">
    <div class="flex flex-wrap items-center gap-2 sm:gap-3">
      <label
        class="inline-flex cursor-pointer items-center gap-2 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-400 disabled:cursor-not-allowed sm:(px-4 py-2 text-sm)"
        :class="disabled ? 'pointer-events-none opacity-60' : ''"
      >
        <Upload class="size-3.5 sm:size-4" />
        <span>{{ buttonLabel }}</span>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          :disabled="disabled"
          @change="handleFileChange"
        />
      </label>

      <span class="text-10px uppercase tracking-0.12em text-stone-500 sm:text-xs">
        Tối đa {{ maxFiles }} ảnh
      </span>
    </div>

    <AtomsUiInlineError :message="localError" />

    <div v-if="allImages.length" class="grid grid-cols-3 gap-3 xl:grid-cols-4">
      <div
        v-for="image in allImages"
        :key="image.key"
        class="group relative overflow-hidden rounded-4 border border-stone-200 bg-stone-100 aspect-3/4 w-full"
      >
        <NuxtImg
          :src="image.url"
          alt="Ảnh đánh giá"
          :width="240"
          :height="320"
          fit="cover"
          class="h-full w-full object-cover object-center"
        />
        <button
          type="button"
          class="absolute right-2 top-2 size-7 center-child rounded-full bg-black/70 text-white opacity-100 transition md:opacity-0 md:group-hover:opacity-100"
          :disabled="disabled"
          @click="removeImage(image)"
        >
          <X class="size-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Upload, X } from "lucide-vue-next";

type TPreviewImage = {
  key: string;
  kind: "existing" | "new";
  url: string;
  index: number;
};

const props = withDefaults(
  defineProps<{
    existingUrls?: string[];
    files?: File[];
    maxFiles?: number;
    disabled?: boolean;
    buttonLabel?: string;
  }>(),
  {
    existingUrls: () => [],
    files: () => [],
    maxFiles: 8,
    disabled: false,
    buttonLabel: "Tải ảnh lên",
  },
);

const emit = defineEmits<{
  "update:existingUrls": [value: string[]];
  "update:files": [value: File[]];
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const localError = ref("");
const objectUrls = ref<string[]>([]);

const totalImageCount = computed(() => props.existingUrls.length + props.files.length);

const newImagePreviews = computed<TPreviewImage[]>(() => {
  return objectUrls.value.map((url, index) => ({
    index,
    key: `new-${index}-${url}`,
    kind: "new",
    url,
  }));
});

const existingImagePreviews = computed<TPreviewImage[]>(() => {
  return props.existingUrls.map((url, index) => ({
    index,
    key: `existing-${index}-${url}`,
    kind: "existing",
    url,
  }));
});

const allImages = computed(() => [...existingImagePreviews.value, ...newImagePreviews.value]);

const revokeObjectUrls = () => {
  objectUrls.value.forEach((url) => URL.revokeObjectURL(url));
  objectUrls.value = [];
};

watch(
  () => props.files,
  (files) => {
    revokeObjectUrls();
    objectUrls.value = files.map((file) => URL.createObjectURL(file));
  },
  { deep: true, immediate: true },
);

onBeforeUnmount(() => {
  revokeObjectUrls();
});

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const incomingFiles = Array.from(input.files || []);
  localError.value = "";

  if (!incomingFiles.length) return;

  const remainingSlots = props.maxFiles - totalImageCount.value;
  if (remainingSlots <= 0) {
    localError.value = `Bạn chỉ có thể tải tối đa ${props.maxFiles} ảnh.`;
    input.value = "";
    return;
  }

  const acceptedFiles = incomingFiles.slice(0, remainingSlots);
  if (acceptedFiles.length < incomingFiles.length) {
    localError.value = `Chỉ nhận thêm ${remainingSlots} ảnh nữa.`;
  }

  emit("update:files", [...props.files, ...acceptedFiles]);
  input.value = "";
};

const removeImage = (image: TPreviewImage) => {
  localError.value = "";

  if (image.kind === "existing") {
    emit(
      "update:existingUrls",
      props.existingUrls.filter((_, index) => index !== image.index),
    );
    return;
  }

  emit(
    "update:files",
    props.files.filter((_, index) => index !== image.index),
  );
};
</script>
