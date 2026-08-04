<template>
  <MoleculesCommonModal
    ref="modalRef"
    header="Phản hồi feedback"
    :is-show-close="true"
    :width="720"
    :close-on-click-overlay="false"
    @on-close-modal="onClose"
  >
    <div class="space-y-4">
      <div
        class="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm"
      >
        <p class="font-semibold text-on-surface">
          #{{ feedback?._id }} · {{ productName }}
        </p>
        <p class="mt-1 text-on-surface-variant">
          {{ feedback?.user?.name || "Ẩn danh" }} · {{ feedback?.user?.email || "Không có email" }}
        </p>
      </div>

      <div class="rounded-xl border border-outline-variant bg-surface px-4 py-3">
        <p class="text-xs font-semibold uppercase tracking-wide text-outline">
          Nội dung feedback khách hàng
        </p>
        <p class="mt-2 whitespace-pre-line text-sm text-on-surface">
          {{ feedback?.comment?.trim() || "Khách hàng chưa nhập nội dung feedback." }}
        </p>
        <div class="mt-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-outline">
            Ảnh đính kèm ({{ feedback?.images?.length || 0 }})
          </p>
          <div v-if="feedback?.images?.length" class="mt-2 flex flex-wrap gap-2">
            <a
              v-for="(image, idx) in feedback?.images || []"
              :key="`${feedback?._id}-${idx}`"
              :href="image"
              target="_blank"
              rel="noreferrer"
              class="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low"
            >
              <NuxtImg :src="image" :width="80" :height="80" class="size-20 object-cover" />
            </a>
          </div>
          <p v-else class="mt-2 text-xs text-outline">Khách hàng không đính kèm ảnh.</p>
        </div>
      </div>

      <AtomsFormItem label="Nội dung phản hồi" :required="true">
        <AtomsFormTextArea
          v-model="content"
          placeholder="Nhập nội dung phản hồi cho người dùng..."
          :disabled="isBusy"
          :rows="5"
        />
      </AtomsFormItem>

      <MoleculesFeedbackImageUploaderInline
        v-model:existing-urls="existingImages"
        v-model:files="newFiles"
        :disabled="isBusy"
        :max-files="10"
        button-label="Đính kèm ảnh phản hồi"
      />

      <AtomsUiInlineError :message="errorMessage" />
    </div>

    <template #footer>
      <AtomsButton type="outline" :disabled="isBusy" @click="closeModal">Hủy</AtomsButton>
      <AtomsButton
        type="primary"
        :is-loading="isBusy"
        :disabled="isBusy || !trimmedContent"
        @click="submitReply"
      >
        Gửi phản hồi
      </AtomsButton>
    </template>
  </MoleculesCommonModal>
</template>

<script setup lang="ts">
import type { TFeedbackManagementItem, TReplyFeedbackDto } from "~/types/feedback.type";
import MoleculesCommonModal from "~/components/molecules/common/Modal.vue";

const { submitting = false } = defineProps<{
  submitting?: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: { id: string; body: TReplyFeedbackDto }];
}>();

const modalRef = ref<InstanceType<typeof MoleculesCommonModal>>();
const feedback = ref<TFeedbackManagementItem | null>(null);
const content = ref("");
const existingImages = ref<string[]>([]);
const newFiles = ref<File[]>([]);
const errorMessage = ref("");

const { uploadFiles, isUploading, error: uploadError } = useUploadFiles();
const trimmedContent = computed(() => content.value.trim());
const isBusy = computed(() => submitting || isUploading.value);
const productName = computed(() => {
  const firstItem = feedback.value?.purchaseOrder?.purchaseItems?.[0];
  if (firstItem?.product?.name) return firstItem.product.name;
  if (firstItem?.productId !== undefined) return `SP ${firstItem.productId}`;
  return "SP";
});

const openModal = (item: TFeedbackManagementItem) => {
  feedback.value = item;
  content.value = "";
  existingImages.value = [];
  newFiles.value = [];
  errorMessage.value = "";
  nextTick(() => modalRef.value?.openModal());
};

const closeModal = () => {
  modalRef.value?.closeModal();
};

const onClose = () => {
  feedback.value = null;
  content.value = "";
  existingImages.value = [];
  newFiles.value = [];
  errorMessage.value = "";
};

const submitReply = async () => {
  if (!feedback.value) return;
  if (!trimmedContent.value) {
    errorMessage.value = "Vui lòng nhập nội dung phản hồi.";
    return;
  }

  try {
    errorMessage.value = "";
    const uploadedImages = await uploadFiles(newFiles.value);
    emit("submit", {
      id: feedback.value._id,
      body: {
        content: trimmedContent.value,
        images: [...existingImages.value, ...uploadedImages],
      },
    });
  } catch {
    errorMessage.value = uploadError.value || "Tải ảnh phản hồi thất bại.";
  }
};

const setError = (message: string) => {
  errorMessage.value = message;
};

defineExpose({
  openModal,
  closeModal,
  setError,
});
</script>
