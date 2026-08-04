<template>
  <div class="flex flex-col gap-2">
    <!-- * DROP ZONE -->
    <div
      :class="[
        'center-child relative flex-col gap-3 rounded-xl border-(2 dashed) p-7 transition-all',
        isDragging
          ? 'border-primary bg-primary/8'
          : 'cursor-pointer border-outline-variant bg-white hover:(border-primary bg-primary/5)',
        disabled ? 'pointer-events-none opacity-50' : '',
      ]"
      @click="openFilePicker"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <input
        ref="inputRef"
        type="file"
        class="hidden"
        :accept="accept"
        :multiple="multiple"
        @change="onFileChange"
      />

      <UploadCloud class="size-10 text-primary" />

      <div class="text-center">
        <p class="text-sm font-medium text-on-surface">
          Kéo thả file vào đây hoặc
          <span class="text-primary underline underline-offset-2">chọn file</span>
        </p>
        <p v-if="accept" class="mt-1 text-xs text-on-surface-variant">
          Định dạng hỗ trợ: {{ accept }}
        </p>
        <p v-if="maxSize" class="text-xs text-on-surface-variant">
          Dung lượng tối đa: {{ formatBytes(maxSize) }}
        </p>
      </div>
    </div>

    <!-- * ERROR MESSAGE -->
    <p v-if="errorMessage" class="text-xs text-danger">{{ errorMessage }}</p>

    <!-- * FILE LIST -->
    <ul v-if="displayUrls.length || selectedFiles.length" class="grid gap-2 sm:grid-cols-2">
      <li
        v-for="(url, index) in displayUrls"
        :key="`url-${url}-${index}`"
        class="relative flex items-center gap-2 rounded-lg border border-outline-variant bg-white p-2.5"
      >
        <img
          :src="url"
          :alt="getUrlFileName(url)"
          class="size-12 shrink-0 rounded-md border border-surface-variant object-cover"
        />
        <span class="flex-1 truncate text-(sm on-surface)">{{ getUrlFileName(url) }}</span>
        <span class="shrink-0 text-(xs on-surface-variant)">Đã tải lên</span>
        <button
          v-if="!disabled"
          type="button"
          class="shrink-0 rounded p-1 text-on-surface-variant transition-colors hover:(bg-danger/10 text-danger)"
          aria-label="Xóa ảnh"
          @click.stop="removeUrl(index)"
        >
          <X class="size-4" />
        </button>
      </li>
      <li
        v-for="(file, index) in selectedFiles"
        :key="`file-${fileKey(file)}`"
        class="relative flex items-center gap-2 rounded-lg border border-outline-variant bg-white p-2.5"
      >
        <img
          v-if="isImageFile(file)"
          :src="getPreviewUrl(file)"
          :alt="file.name"
          class="size-12 shrink-0 rounded-md border border-surface-variant object-cover"
        />
        <div
          v-else
          class="center-child size-12 shrink-0 rounded-md border border-surface-variant bg-surface-container-low"
        >
          <FileText class="size-5 text-secondary" />
        </div>
        <span class="flex-1 truncate text-(sm on-surface)">{{ file.name }}</span>
        <span class="shrink-0 text-(xs on-surface-variant)">{{ formatBytes(file.size) }}</span>
        <button
          v-if="!disabled"
          type="button"
          class="shrink-0 rounded p-1 text-on-surface-variant transition-colors hover:(bg-danger/10 text-danger)"
          aria-label="Xóa file"
          @click.stop="removeFile(index)"
        >
          <X class="size-4" />
        </button>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { UploadCloud, FileText, X } from "lucide-vue-next";

const props = defineProps<{
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  disabled?: boolean;
  urls?: string[];
}>();

const emit = defineEmits<{
  (e: "update:files", files: File[]): void;
  (e: "update:urls", urls: string[]): void;
  (e: "error", message: string): void;
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const selectedFiles = ref<File[]>([]);
const errorMessage = ref("");
const previewMap = ref<Record<string, string>>({});

const displayUrls = computed(() => props.urls ?? []);

const openFilePicker = () => {
  inputRef.value?.click();
};

const validateAndAdd = (incoming: FileList | null) => {
  if (!incoming) return;
  errorMessage.value = "";

  const newFiles: File[] = Array.from(incoming);

  if (props.maxSize) {
    const oversized = newFiles.find((f) => f.size > props.maxSize!);
    if (oversized) {
      errorMessage.value = `File "${oversized.name}" vượt quá dung lượng tối đa (${formatBytes(props.maxSize)}).`;
      emit("error", errorMessage.value);
      return;
    }
  }

  if (props.multiple) {
    selectedFiles.value = [...selectedFiles.value, ...newFiles];
  } else {
    selectedFiles.value = [newFiles[0]].filter((item) => item !== undefined);
  }

  emit("update:files", selectedFiles.value);

  if (inputRef.value) inputRef.value.value = "";
};

const onFileChange = (e: Event) => {
  validateAndAdd((e.target as HTMLInputElement).files);
};

const onDrop = (e: DragEvent) => {
  isDragging.value = false;
  validateAndAdd(e.dataTransfer?.files ?? null);
};

const removeFile = (index: number) => {
  selectedFiles.value = selectedFiles.value.filter((_, i) => i !== index);
  emit("update:files", selectedFiles.value);
};

const removeUrl = (index: number) => {
  const nextUrls = displayUrls.value.filter((_, i) => i !== index);
  emit("update:urls", nextUrls);
};

const getUrlFileName = (url: string) => {
  try {
    const pathname = new URL(url, window.location.origin).pathname;
    const fileName = pathname.split("/").pop();
    return fileName || url;
  } catch {
    return url.split("/").pop() || url;
  }
};

const fileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

const isImageFile = (file: File) => file.type.startsWith("image/");

const syncPreviewMap = () => {
  const nextKeys = new Set(
    selectedFiles.value.filter((file) => isImageFile(file)).map((file) => fileKey(file)),
  );

  Object.entries(previewMap.value).forEach(([key, url]) => {
    if (!nextKeys.has(key)) {
      URL.revokeObjectURL(url);
      delete previewMap.value[key];
    }
  });

  selectedFiles.value.forEach((file) => {
    if (!isImageFile(file)) return;
    const key = fileKey(file);
    if (!previewMap.value[key]) {
      previewMap.value[key] = URL.createObjectURL(file);
    }
  });
};

const getPreviewUrl = (file: File) => previewMap.value[fileKey(file)] ?? "";

watch(selectedFiles, syncPreviewMap);

onBeforeUnmount(() => {
  Object.values(previewMap.value).forEach((url) => URL.revokeObjectURL(url));
});

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
</script>
