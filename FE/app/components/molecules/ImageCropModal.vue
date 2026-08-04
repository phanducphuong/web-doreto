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
        <img
          v-if="previewUrl"
          ref="imageRef"
          :src="previewUrl"
          alt=""
          class="image-crop-modal__image"
          @load="onImageLoad"
        />
      </div>
      <p class="image-crop-modal__hint">Kéo để chọn vùng cắt, sau đó bấm Xác nhận để tải ảnh lên.</p>
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

const modalRef = ref();
const imageRef = ref<HTMLImageElement | null>(null);
const previewUrl = ref("");
const isSubmitting = ref(false);
const sourceFile = ref<File | null>(null);
const cropper = ref<Cropper | null>(null);
const pendingResolve = ref<((file: File | null) => void) | null>(null);
const isImageReady = ref(false);

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
};

const resolvePending = (file: File | null) => {
  pendingResolve.value?.(file);
  pendingResolve.value = null;
};

const initCropper = () => {
  if (!imageRef.value || !isImageReady.value || cropper.value) return;

  cropper.value = new Cropper(imageRef.value, {
    viewMode: 1,
    dragMode: "move",
    autoCropArea: 0.9,
    responsive: true,
    background: false,
    guides: true,
    movable: true,
    zoomable: true,
    scalable: false,
    rotatable: false,
  });
};

const onImageLoad = () => {
  isImageReady.value = true;
  nextTick(() => initCropper());
};

const open = (file: File): Promise<File | null> => {
  resetState();
  sourceFile.value = file;
  previewUrl.value = URL.createObjectURL(file);

  return new Promise((resolve) => {
    pendingResolve.value = resolve;
    modalRef.value?.openModal();
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

.image-crop-modal__image {
  display: block;
  max-width: 100%;
}

.image-crop-modal__hint {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}
</style>
