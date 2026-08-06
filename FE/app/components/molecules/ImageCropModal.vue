<template>
  <MoleculesCommonModal
    ref="modalRef"
    header="Cắt ảnh"
    :width="720"
    :is-show-close="true"
    :close-on-click-overlay="false"
    @on-close-modal="handleModalClose"
  >
    <div class="image-crop-modal">
      <div class="image-crop-modal__viewport">
        <p v-if="isLoadingSource" class="image-crop-modal__loading">Đang tải ảnh...</p>
        <div v-else-if="loadError" class="image-crop-modal__error">
          <p>{{ loadError }}</p>
          <AtomsButton type="primary" @click="retryLoad">Thử lại</AtomsButton>
        </div>
        <img
          v-if="previewUrl"
          ref="imageRef"
          :src="previewUrl"
          alt=""
          class="image-crop-modal__image"
          @load="onImageLoad"
        />
      </div>

      <div class="image-crop-modal__controls">
        <AtomsButton
          circle
          type="ghost"
          :icon="Minus"
          :disabled="!cropper"
          title="Thu nhỏ"
          @click="zoomBy(-ZOOM_STEP)"
        />
        <input
          type="range"
          class="image-crop-modal__slider"
          :min="minZoom"
          :max="maxZoom"
          :step="sliderStep"
          :value="currentZoom"
          :disabled="!cropper || maxZoom <= minZoom"
          aria-label="Mức thu phóng"
          @input="onSlider"
        />
        <AtomsButton
          circle
          type="ghost"
          :icon="Plus"
          :disabled="!cropper"
          title="Phóng to"
          @click="zoomBy(ZOOM_STEP)"
        />
      </div>
      <p class="image-crop-modal__hint">
        Kéo ảnh để căn chỉnh, dùng thanh trượt, nút +/− hoặc lăn chuột để thu phóng.
      </p>
    </div>
    <template #footer>
      <AtomsButton type="ghost" :disabled="isSubmitting" @click="cancel">Hủy</AtomsButton>
      <AtomsButton type="primary" :is-loading="isSubmitting" @click="submit">Xác nhận</AtomsButton>
    </template>
  </MoleculesCommonModal>
</template>

<script setup lang="ts">
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";
import { Minus, Plus } from "lucide-vue-next";

type TCropOptions = {
  /** Tỉ lệ khung cắt cố định (vd 4/5, 1). Bỏ trống = cắt tự do như cũ. */
  aspectRatio?: number;
};

const ZOOM_STEP = 0.1;
const MAX_ZOOM_MULTIPLIER = 10;

const modalRef = ref();
const imageRef = ref<HTMLImageElement | null>(null);
const previewUrl = ref("");
const isSubmitting = ref(false);
const isLoadingSource = ref(false);
const loadError = ref("");
const lastSource = ref<File | string | null>(null);
const sourceFile = ref<File | null>(null);
const cropper = ref<Cropper | null>(null);
const pendingResolve = ref<((file: File | null) => void) | null>(null);
const isImageReady = ref(false);
const cropAspectRatio = ref<number | undefined>(undefined);
const minZoom = ref(0);
const maxZoom = ref(0);
const currentZoom = ref(0);

const isFixedRatio = computed(() => Number.isFinite(cropAspectRatio.value));

// Chia dải zoom thành 100 bước để thanh trượt mượt
const sliderStep = computed(() => {
  const range = maxZoom.value - minZoom.value;
  return range > 0 ? range / 100 : 0.001;
});

const destroyCropper = () => {
  cropper.value?.destroy();
  cropper.value = null;
};

const revokePreviewUrl = () => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = "";
  }
};

const resetState = () => {
  destroyCropper();
  revokePreviewUrl();
  sourceFile.value = null;
  isImageReady.value = false;
  isSubmitting.value = false;
  isLoadingSource.value = false;
  loadError.value = "";
  minZoom.value = 0;
  maxZoom.value = 0;
  currentZoom.value = 0;
};

const resolvePending = (file: File | null) => {
  pendingResolve.value?.(file);
  pendingResolve.value = null;
};

const initCropper = () => {
  if (!imageRef.value || !isImageReady.value || cropper.value) return;

  const fixed = isFixedRatio.value;

  cropper.value = new Cropper(imageRef.value, {
    viewMode: 1,
    dragMode: "move",
    aspectRatio: cropAspectRatio.value ?? NaN,
    autoCropArea: fixed ? 1 : 0.9,
    cropBoxMovable: !fixed,
    cropBoxResizable: !fixed,
    toggleDragModeOnDblclick: false,
    responsive: true,
    background: false,
    guides: !fixed,
    movable: true,
    zoomable: true,
    scalable: false,
    rotatable: false,
    ready: () => {
      if (!cropper.value) return;
      const image = cropper.value.getImageData();
      if (!image.naturalWidth || !image.naturalHeight) return;

      const fitRatio = image.width / image.naturalWidth;
      let base = fitRatio;
      if (fixed) {
        // Mức zoom nhỏ nhất: ảnh vừa đủ phủ kín khung cắt (không để lộ nền)
        const cropBox = cropper.value.getCropBoxData();
        base = Math.max(
          cropBox.width / image.naturalWidth,
          cropBox.height / image.naturalHeight,
        );
      }

      minZoom.value = base;
      maxZoom.value = base * MAX_ZOOM_MULTIPLIER;
      currentZoom.value = Math.min(Math.max(fitRatio, minZoom.value), maxZoom.value);
    },
    zoom: (event) => {
      const { ratio, oldRatio } = event.detail;
      if (minZoom.value && maxZoom.value) {
        const isZoomingOut = ratio < oldRatio;
        const tooSmall = ratio < minZoom.value && isZoomingOut;
        const tooLarge = ratio > maxZoom.value && !isZoomingOut;
        if (tooSmall || tooLarge) {
          event.preventDefault();
          return;
        }
      }
      currentZoom.value = ratio;
    },
  });
};

const onImageLoad = () => {
  isImageReady.value = true;
  nextTick(() => initCropper());
};

const zoomBy = (amount: number) => {
  cropper.value?.zoom(amount);
};

const onSlider = (event: Event) => {
  const value = Number((event.target as HTMLInputElement).value);
  if (!cropper.value || Number.isNaN(value)) return;
  cropper.value.zoomTo(value);
  currentZoom.value = value;
};

// Ảnh trên CDN khác origin -> tải qua proxy cùng-origin của app để không phụ
// thuộc CORS của CDN (xem server/api/crop-image.get.ts). Ảnh cùng origin hoặc
// blob/data thì giữ nguyên.
const toLoadableUrl = (url: string): string => {
  if (!/^https?:\/\//i.test(url)) return url;
  try {
    if (new URL(url).origin === window.location.origin) return url;
  } catch {
    return url;
  }
  return `/api/crop-image?url=${encodeURIComponent(url)}`;
};

const fileFromUrl = async (url: string): Promise<File> => {
  const response = await fetch(toLoadableUrl(url));
  if (!response.ok) throw new Error(`Không tải được ảnh (${response.status})`);
  const blob = await response.blob();
  const type = blob.type.startsWith("image/") ? blob.type : "image/jpeg";
  const baseName = url.split("/").pop()?.split("?")[0] || "image";
  return new File([blob], baseName, { type });
};

const loadSource = async (source: File | string) => {
  lastSource.value = source;
  loadError.value = "";
  if (typeof source !== "string") {
    sourceFile.value = source;
    previewUrl.value = URL.createObjectURL(source);
    return;
  }

  try {
    isLoadingSource.value = true;
    const file = await fileFromUrl(source);
    // User có thể đã đóng modal trong lúc chờ tải ảnh
    if (!pendingResolve.value) return;
    sourceFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
  } catch {
    // KHÔNG đóng modal (trước đây close() ở đây khiến popup "nháy rồi mất").
    // Giữ modal, báo lỗi rõ để user bấm thử lại hoặc đóng.
    loadError.value = "Không tải được ảnh. Vui lòng thử lại.";
  } finally {
    isLoadingSource.value = false;
  }
};

const retryLoad = () => {
  if (lastSource.value != null) void loadSource(lastSource.value);
};

const open = (source: File | string, options: TCropOptions = {}): Promise<File | null> => {
  resetState();
  cropAspectRatio.value = options.aspectRatio;

  return new Promise((resolve) => {
    pendingResolve.value = resolve;
    modalRef.value?.openModal();
    void loadSource(source);
  });
};

const close = () => {
  modalRef.value?.closeModal();
};

const cancel = () => {
  resolvePending(null);
  close();
};

const handleModalClose = () => {
  if (pendingResolve.value) {
    resolvePending(null);
  }
  resetState();
};

const canvasToFile = (canvas: HTMLCanvasElement, file: File): Promise<File> => {
  const outputType = file.type.startsWith("image/") ? file.type : "image/jpeg";

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Không thể cắt ảnh."));
          return;
        }

        const extension = outputType.split("/")[1] || "jpg";
        const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
        resolve(new File([blob], `${baseName}-cropped.${extension}`, { type: outputType }));
      },
      outputType,
      0.92,
    );
  });
};

const submit = async () => {
  if (!cropper.value || !sourceFile.value || isSubmitting.value) return;

  try {
    isSubmitting.value = true;
    const canvas = cropper.value.getCroppedCanvas({
      maxWidth: 4096,
      maxHeight: 4096,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high",
    });

    if (!canvas) {
      throw new Error("Không thể cắt ảnh.");
    }

    const croppedFile = await canvasToFile(canvas, sourceFile.value);
    resolvePending(croppedFile);
    close();
  } catch {
    resolvePending(null);
    close();
  } finally {
    isSubmitting.value = false;
  }
};

onBeforeUnmount(() => {
  resolvePending(null);
  resetState();
});

defineExpose({
  open,
  close,
});
</script>

<style scoped>
.image-crop-modal {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 8px;
}

.image-crop-modal__viewport {
  width: 100%;
  max-height: min(60vh, 520px);
  overflow: hidden;
  background: #f3f4f6;
  border-radius: 12px;
}

.image-crop-modal__loading {
  margin: 0;
  padding: 48px 0;
  text-align: center;
  font-size: 13px;
  color: #6b7280;
}

.image-crop-modal__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 16px;
  text-align: center;
  font-size: 13px;
  color: #b91c1c;
}

.image-crop-modal__image {
  display: block;
  max-width: 100%;
}

.image-crop-modal__controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.image-crop-modal__slider {
  flex: 1;
  min-width: 0;
  height: 4px;
  cursor: pointer;
  accent-color: #d3a59c;
}

.image-crop-modal__slider:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.image-crop-modal__hint {
  margin: 8px 0 0;
  font-size: 13px;
  color: #6b7280;
}
</style>
