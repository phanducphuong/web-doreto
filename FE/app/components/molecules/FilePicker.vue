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

    <!-- * FILE LIST — kéo-thả để đổi thứ tự; ảnh ở vị trí đầu = ảnh đại diện -->
    <p
      v-if="enableFeatured && !disabled && items.length > 1"
      class="text-xs text-on-surface-variant"
    >
      Kéo để sắp xếp thứ tự ảnh. Ảnh đầu tiên là ảnh đại diện (hiện đầu trang chi tiết).
    </p>
    <ul v-if="items.length" class="grid gap-2 sm:grid-cols-2">
      <li
        v-for="(item, index) in items"
        :key="item.key"
        :draggable="!disabled"
        class="group relative flex items-center gap-2 rounded-lg border bg-white p-2.5 transition-colors"
        :class="[
          enableFeatured && index === 0
            ? 'border-primary ring-1 ring-primary/40'
            : 'border-outline-variant',
          dragOverIndex === index && dragIndex !== null && dragIndex !== index
            ? 'ring-2 ring-primary/60'
            : '',
          dragIndex === index ? 'opacity-40' : '',
          disabled ? '' : 'cursor-move',
        ]"
        @dragstart="onDragStart(index, $event)"
        @dragover.prevent="onDragOverItem(index)"
        @drop.prevent="onDropItem(index)"
        @dragend="onDragEndItem"
      >
        <GripVertical v-if="!disabled" class="size-4 shrink-0 text-outline-variant" />

        <img
          v-if="item.url"
          :src="item.url"
          :alt="item.name"
          class="size-12 shrink-0 rounded-md border border-surface-variant object-cover"
        />
        <div
          v-else
          class="center-child size-12 shrink-0 rounded-md border border-surface-variant bg-surface-container-low"
        >
          <FileText class="size-5 text-secondary" />
        </div>

        <div class="flex-1 min-w-0">
          <span class="block truncate text-(sm on-surface)">{{ item.name }}</span>
          <span
            v-if="enableFeatured && index === 0"
            class="mt-0.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary"
          >
            <Star class="size-3 fill-current" /> Ảnh đại diện
          </span>
          <span v-else class="text-(xs on-surface-variant)">{{ item.subtitle }}</span>
        </div>

        <button
          v-if="enableFeatured && !disabled && index !== 0"
          type="button"
          class="shrink-0 rounded p-1 text-on-surface-variant transition-colors hover:(bg-primary/10 text-primary)"
          aria-label="Đặt làm ảnh đại diện"
          title="Đưa lên đầu làm ảnh đại diện"
          @click.stop="setFeatured(item.key)"
        >
          <Star class="size-4" />
        </button>
        <button
          v-if="!disabled"
          type="button"
          class="shrink-0 rounded p-1 text-on-surface-variant transition-colors hover:(bg-danger/10 text-danger)"
          aria-label="Xóa"
          @click.stop="removeItem(index)"
        >
          <X class="size-4" />
        </button>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { UploadCloud, FileText, X, Star, GripVertical } from "lucide-vue-next";

const props = defineProps<{
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  disabled?: boolean;
  urls?: string[];
  /** Bật chức năng chọn ảnh đại diện trong danh sách */
  enableFeatured?: boolean;
  /** Key của ảnh đại diện hiện tại (url với ảnh đã tải, fileKey với file mới) */
  featured?: string;
}>();

const emit = defineEmits<{
  (e: "update:files", files: File[]): void;
  (e: "update:urls", urls: string[]): void;
  (e: "update:featured", key: string): void;
  (e: "error", message: string): void;
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const selectedFiles = ref<File[]>([]);
const errorMessage = ref("");
const previewMap = ref<Record<string, string>>({});

const displayUrls = computed(() => props.urls ?? []);

// Danh sách gộp (ảnh đã tải + file mới) theo đúng thứ tự hiển thị, để kéo-thả sắp xếp.
type GalleryItem = {
  kind: "url" | "file";
  key: string;
  url: string;
  file: File | null;
  name: string;
  subtitle: string;
};

const items = computed<GalleryItem[]>(() => [
  ...displayUrls.value.map((url) => ({
    kind: "url" as const,
    key: url,
    url,
    file: null,
    name: getUrlFileName(url),
    subtitle: "Đã tải lên",
  })),
  ...selectedFiles.value.map((file) => ({
    kind: "file" as const,
    key: fileKey(file),
    url: isImageFile(file) ? getPreviewUrl(file) : "",
    file,
    name: file.name,
    subtitle: formatBytes(file.size),
  })),
]);

// Áp thứ tự mới: tách lại thành mảng url và mảng file (giữ thứ tự tương đối),
// đồng bộ ra ngoài + đặt ảnh đầu tiên làm ảnh đại diện.
// Lưu ý: url và file là 2 v-model tách biệt nên nếu chèn file XEN giữa các url,
// khi lưu file sẽ dồn về sau các url (trường hợp hiếm); riêng vị trí ĐẦU luôn đúng.
const applyOrder = (ordered: GalleryItem[]) => {
  const urls = ordered.filter((i) => i.kind === "url").map((i) => i.key);
  const files = ordered.filter((i) => i.kind === "file").map((i) => i.file as File);
  selectedFiles.value = files;
  emit("update:urls", urls);
  emit("update:files", files);
  if (props.enableFeatured) emit("update:featured", ordered[0]?.key ?? "");
};

const dragIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);

const onDragStart = (index: number, e: DragEvent) => {
  if (props.disabled) return;
  dragIndex.value = index;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }
};

const onDragOverItem = (index: number) => {
  if (props.disabled || dragIndex.value === null) return;
  dragOverIndex.value = index;
};

const moveItem = (from: number, to: number) => {
  if (from === null || to === null || from === to) return;
  const arr = [...items.value];
  const [moved] = arr.splice(from, 1);
  if (!moved) return;
  arr.splice(to, 0, moved);
  applyOrder(arr);
};

const onDropItem = (index: number) => {
  if (dragIndex.value !== null) moveItem(dragIndex.value, index);
  onDragEndItem();
};

const onDragEndItem = () => {
  dragIndex.value = null;
  dragOverIndex.value = null;
};

// Nút sao / đưa lên đầu = đặt làm ảnh đại diện
const setFeatured = (key: string) => {
  const idx = items.value.findIndex((i) => i.key === key);
  if (idx > 0) moveItem(idx, 0);
};

const removeItem = (index: number) => {
  applyOrder(items.value.filter((_, i) => i !== index));
};

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
