<template>
  <button
    type="button"
    class="group relative h-20 w-20 overflow-hidden rounded-lg border-2 border-dashed transition-all center-child"
    :class="wrapperClass"
    :disabled="disabled"
    @click="openPicker"
  >
    <input
      ref="inputRef"
      type="file"
      class="hidden"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      @change="onFileChange"
    />

    <img v-if="previewUrl" :src="previewUrl" :alt="alt" class="h-full w-full object-cover" />

    <span
      class="center-child absolute inset-0 text-2xl font-medium transition-all"
      :class="overlayClass"
      aria-hidden="true"
    >
      +
    </span>
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    file?: File | null;
    imageUrl?: string;
    accept?: string;
    multiple?: boolean;
    disabled?: boolean;
    alt?: string;
  }>(),
  {
    file: null,
    imageUrl: "",
    accept: ".png,.webp,.jpg,.jpeg",
    multiple: false,
    disabled: false,
    alt: "image",
  },
);

const emit = defineEmits<{
  "update:file": [value: File | null];
  "update:files": [value: File[]];
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const objectUrl = ref("");

const previewUrl = computed(() => objectUrl.value || props.imageUrl);

const wrapperClass = computed(() => {
  if (props.disabled) return "cursor-not-allowed border-outline-variant bg-surface-container-low opacity-60";
  if (previewUrl.value) return "cursor-pointer border-#E4B6AE";
  return "cursor-pointer border-#E4B6AE bg-#F8F4F3 hover:bg-#EFEAE8";
});

const overlayClass = computed(() => {
  if (!previewUrl.value) return "bg-transparent text-#D3A59C";
  return "bg-black/0 text-white/0 group-hover:bg-black/35 group-hover:text-white";
});

const revokeObjectUrl = () => {
  if (!objectUrl.value) return;
  URL.revokeObjectURL(objectUrl.value);
  objectUrl.value = "";
};

watch(
  () => props.file,
  (file) => {
    revokeObjectUrl();
    if (file) {
      objectUrl.value = URL.createObjectURL(file);
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  revokeObjectUrl();
});

const openPicker = () => {
  if (props.disabled) return;
  inputRef.value?.click();
};

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const selectedFiles = Array.from(target.files || []);
  if (props.multiple) {
    if (selectedFiles.length) emit("update:files", selectedFiles);
  } else {
    emit("update:file", selectedFiles[0] || null);
  }
  target.value = "";
};
</script>
