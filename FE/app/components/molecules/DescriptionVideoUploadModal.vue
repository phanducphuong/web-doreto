<template>
  <MoleculesCommonModal
    ref="modalRef"
    header="Tải video mô tả"
    :width="560"
    :is-show-close="!isBusy"
    :close-on-click-overlay="false"
    @on-close-modal="handleModalClose"
  >
    <div class="description-video-upload-modal">
      <p class="description-video-upload-modal__file-name">{{ sourceFileName }}</p>

      <div class="description-video-upload-modal__phase">
        <span class="description-video-upload-modal__phase-label">
          {{ phaseLabel }}
        </span>
        <span class="description-video-upload-modal__phase-percent">{{ progressPercent }}%</span>
      </div>

      <div class="description-video-upload-modal__track" aria-hidden="true">
        <div
          class="description-video-upload-modal__fill"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>

      <p class="description-video-upload-modal__hint">{{ phaseHint }}</p>

      <p v-if="errorMessage" class="description-video-upload-modal__error">{{ errorMessage }}</p>
    </div>

    <template #footer>
      <AtomsButton type="ghost" :disabled="isBusy && !canCancel" @click="cancel">
        {{ isBusy ? "Hủy" : "Đóng" }}
      </AtomsButton>
    </template>
  </MoleculesCommonModal>
</template>

<script setup lang="ts">
import type { TDescriptionVideoUploadPhase } from "~/composables/useUploadDescriptionVideo";
import { getVideoUploadErrorMessage } from "~/utils/video-upload.utils";

const modalRef = ref();
const { uploadDescriptionVideo } = useUploadDescriptionVideo();

const sourceFile = ref<File | null>(null);
const sourceFileName = ref("");
const phase = ref<TDescriptionVideoUploadPhase>("idle");
const progressPercent = ref(0);
const errorMessage = ref("");
const isBusy = ref(false);
const abortController = ref<AbortController | null>(null);
const pendingResolve = ref<((url: string | null) => void) | null>(null);

const canCancel = computed(() => Boolean(abortController.value));

const phaseLabel = computed(() => {
  if (phase.value === "uploading") return "Đang tải lên";
  if (errorMessage.value) return "Upload thất bại";
  return "Sẵn sàng";
});

const phaseHint = computed(() => {
  if (phase.value === "uploading") {
    return "Đang upload trực tiếp lên Cloudflare R2.";
  }
  if (errorMessage.value) return "Vui lòng thử lại hoặc chọn video khác.";
  return "Chuẩn bị upload video.";
});

const resetState = () => {
  sourceFile.value = null;
  sourceFileName.value = "";
  phase.value = "idle";
  progressPercent.value = 0;
  errorMessage.value = "";
  isBusy.value = false;
  abortController.value = null;
};

const resolvePending = (url: string | null) => {
  pendingResolve.value?.(url);
  pendingResolve.value = null;
};

const close = () => {
  modalRef.value?.closeModal();
};

const startUpload = async (file: File) => {
  isBusy.value = true;
  errorMessage.value = "";
  phase.value = "uploading";
  progressPercent.value = 0;

  const controller = new AbortController();
  abortController.value = controller;

  try {
    const result = await uploadDescriptionVideo(file, {
      signal: controller.signal,
      onProgress: ({ phase: nextPhase, percent }) => {
        phase.value = nextPhase;
        progressPercent.value = percent;
      },
    });

    resolvePending(result.url);
    close();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      resolvePending(null);
      close();
      return;
    }

    errorMessage.value = getVideoUploadErrorMessage(error);
    phase.value = "idle";
    progressPercent.value = 0;
    isBusy.value = false;
    abortController.value = null;
  }
};

const open = (file: File): Promise<string | null> => {
  resetState();
  sourceFile.value = file;
  sourceFileName.value = file.name;

  return new Promise((resolve) => {
    pendingResolve.value = resolve;
    modalRef.value?.openModal();
    nextTick(() => {
      startUpload(file);
    });
  });
};

const cancel = () => {
  if (isBusy.value) {
    abortController.value?.abort();
    return;
  }

  resolvePending(null);
  close();
};

const handleModalClose = () => {
  if (isBusy.value) {
    abortController.value?.abort();
  }

  if (pendingResolve.value) {
    resolvePending(null);
  }

  resetState();
};

defineExpose({
  open,
  close,
});
</script>

<style scoped>
.description-video-upload-modal {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 8px;
}

.description-video-upload-modal__file-name {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  word-break: break-all;
}

.description-video-upload-modal__phase {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.description-video-upload-modal__phase-label {
  font-size: 13px;
  font-weight: 600;
  color: #8b0000;
}

.description-video-upload-modal__phase-percent {
  font-size: 12px;
  color: #6b7280;
}

.description-video-upload-modal__track {
  width: 100%;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #ece9e7;
}

.description-video-upload-modal__fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #8b0000, #c45c5c);
  transition: width 0.2s ease;
}

.description-video-upload-modal__hint {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

.description-video-upload-modal__error {
  margin: 0;
  font-size: 12px;
  color: #b42318;
}
</style>
