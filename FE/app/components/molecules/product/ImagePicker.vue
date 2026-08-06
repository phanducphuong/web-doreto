<template>
  <MoleculesCommonModal
    ref="modalRef"
    header="Chọn ảnh sản phẩm"
    :width="640"
    :is-show-close="true"
    :close-on-click-overlay="true"
    @on-close-modal="handleClose"
  >
    <div class="space-y-4 py-2">
      <p class="text-xs text-on-surface-variant">
        Bấm chọn 1 ảnh có sẵn của sản phẩm, hoặc bấm "Tải ảnh lên" để thêm ảnh mới.
      </p>

      <div v-if="items.length" class="product-image-masonry">
        <button
          v-for="(item, idx) in items"
          :key="item.key"
          type="button"
          class="product-image-item group relative block overflow-hidden rounded-lg border border-outline-variant hover:border-primary"
          @click="pick(item)"
        >
          <img
            :src="item.preview"
            :alt="`Ảnh ${idx + 1}`"
            class="block h-auto w-full object-contain"
          />
          <span
            class="absolute inset-0 hidden items-center justify-center bg-black/35 text-xs font-semibold text-white group-hover:flex"
          >
            Chọn
          </span>
        </button>
      </div>
      <div
        v-else
        class="rounded-lg border border-dashed border-outline-variant p-6 text-center text-xs text-on-surface-variant"
      >
        Sản phẩm chưa có ảnh nào. Hãy bấm "Tải ảnh lên".
      </div>

      <input ref="inputRef" type="file" class="hidden" :accept="accept" @change="onUpload" />
    </div>

    <template #footer>
      <AtomsButton type="ghost" @click="cancel">Hủy</AtomsButton>
      <AtomsButton type="primary" :icon="Upload" @click="triggerUpload">Tải ảnh lên</AtomsButton>
    </template>
  </MoleculesCommonModal>
</template>

<script setup lang="ts">
import { Upload } from "lucide-vue-next";
import MoleculesCommonModal from "~/components/molecules/common/Modal.vue";

type TPickResult = { url?: string; file?: File };
type TGalleryItem = {
  key: string;
  preview: string;
  url?: string;
  file?: File;
};

const accept = ".png,.webp,.jpg,.jpeg";

const modalRef = ref<InstanceType<typeof MoleculesCommonModal>>();
const inputRef = ref<HTMLInputElement | null>(null);
const items = ref<TGalleryItem[]>([]);
const objectUrls = ref<string[]>([]);
const pendingResolve = ref<((result: TPickResult | null) => void) | null>(null);

const revokeObjectUrls = () => {
  objectUrls.value.forEach((url) => URL.revokeObjectURL(url));
  objectUrls.value = [];
};

const buildItems = (urls: string[], files: File[]) => {
  revokeObjectUrls();
  const urlItems: TGalleryItem[] = urls
    .filter(Boolean)
    .map((url, index) => ({ key: `url-${index}-${url}`, preview: url, url }));
  const fileItems: TGalleryItem[] = files.map((file, index) => {
    const preview = URL.createObjectURL(file);
    objectUrls.value.push(preview);
    return { key: `file-${index}-${file.name}-${file.size}`, preview, file };
  });
  items.value = [...urlItems, ...fileItems];
};

const resolvePending = (result: TPickResult | null) => {
  pendingResolve.value?.(result);
  pendingResolve.value = null;
};

const open = (opts: { urls?: string[]; files?: File[] }): Promise<TPickResult | null> => {
  buildItems(opts.urls ?? [], opts.files ?? []);
  return new Promise((resolve) => {
    pendingResolve.value = resolve;
    modalRef.value?.openModal();
  });
};

const close = () => modalRef.value?.closeModal();

const pick = (item: TGalleryItem) => {
  if (item.url) resolvePending({ url: item.url });
  else if (item.file) resolvePending({ file: item.file });
  close();
};

const triggerUpload = () => inputRef.value?.click();

const onUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0] || null;
  target.value = "";
  if (!file) return;
  resolvePending({ file });
  close();
};

const cancel = () => {
  resolvePending(null);
  close();
};

// Đóng modal (bấm X / overlay) mà chưa chọn -> trả null để cha biết đã hủy
const handleClose = () => {
  if (pendingResolve.value) resolvePending(null);
};

onBeforeUnmount(() => {
  resolvePending(null);
  revokeObjectUrls();
});

defineExpose({ open, close });
</script>

<style scoped>
/* Xếp ảnh theo cột, mỗi ảnh giữ nguyên tỷ lệ gốc (kiểu masonry) để dễ chọn */
.product-image-masonry {
  column-count: 2;
  column-gap: 12px;
}

@media (min-width: 640px) {
  .product-image-masonry {
    column-count: 3;
  }
}

.product-image-item {
  width: 100%;
  margin-bottom: 12px;
  break-inside: avoid;
}
</style>
