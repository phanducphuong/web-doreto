<template>
  <MoleculesCommonModal
    ref="modalRef"
    :header="isEditMode ? 'Sửa đánh giá' : 'Tạo đánh giá'"
    :is-show-close="true"
    :width="720"
    :close-on-click-overlay="false"
    @on-close-modal="onClose"
  >
    <div class="space-y-4">
      <template v-if="!isEditMode && !presetProduct">
        <div class="flex flex-wrap items-end gap-3">
          <AtomsFormItem label="Tìm sản phẩm" class="min-w-64 flex-1">
            <AtomsFormInput
              v-model="productKeyword"
              placeholder="Nhập tên sản phẩm..."
              :disabled="isBusy"
              @keyup.enter="searchProducts"
            />
          </AtomsFormItem>
          <AtomsButton type="outline" :disabled="isBusy" @click="searchProducts">Tìm</AtomsButton>
        </div>

        <AtomsFormItem label="Sản phẩm" :required="true">
          <AtomsFormSelectBox
            v-model="form.productId"
            :options="productOptions"
            placeholder="Chọn sản phẩm"
            :disabled="isBusy"
          />
        </AtomsFormItem>
      </template>

      <div
        v-else-if="isEditMode || presetProduct"
        class="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm"
      >
        <p class="font-semibold text-on-surface">{{ productLabel }}</p>
        <p v-if="feedback?.isAdminCreated" class="mt-1 text-xs text-on-surface-variant">
          Đánh giá do admin tạo
        </p>
      </div>

      <AtomsFormItem label="Tên hiển thị" :required="!isEditMode">
        <AtomsFormInput
          v-model="form.displayName"
          placeholder="Ví dụ: Nguyễn Văn A"
          :disabled="isBusy || (isEditMode && !feedback?.isAdminCreated)"
        />
      </AtomsFormItem>

      <AtomsFormItem label="Số sao" :required="true">
        <MoleculesFeedbackStarRatingInput v-model="form.score" :disabled="isBusy" />
      </AtomsFormItem>

      <AtomsFormItem label="Bình luận">
        <AtomsFormTextArea
          v-model="form.comment"
          placeholder="Nhập nội dung đánh giá..."
          :disabled="isBusy"
          :rows="4"
        />
      </AtomsFormItem>

      <MoleculesFeedbackImageUploaderInline
        v-model:existing-urls="existingImages"
        v-model:files="newFiles"
        :disabled="isBusy"
        :max-files="10"
        button-label="Đính kèm ảnh đánh giá"
      />

      <AtomsUiInlineError :message="errorMessage" />
    </div>

    <template #footer>
      <AtomsButton type="outline" :disabled="isBusy" @click="closeModal">Hủy</AtomsButton>
      <AtomsButton
        type="primary"
        :is-loading="isBusy"
        :disabled="isBusy || !canSubmit"
        @click="submitForm"
      >
        {{ isEditMode ? "Lưu thay đổi" : "Tạo đánh giá" }}
      </AtomsButton>
    </template>
  </MoleculesCommonModal>
</template>

<script setup lang="ts">
import type {
  TAdminCreateFeedbackDto,
  TAdminUpdateFeedbackDto,
  TFeedbackManagementItem,
} from "~/types/feedback.type";
import MoleculesCommonModal from "~/components/molecules/common/Modal.vue";

const { submitting = false } = defineProps<{
  submitting?: boolean;
}>();

const emit = defineEmits<{
  create: [body: TAdminCreateFeedbackDto];
  update: [payload: { id: string; body: TAdminUpdateFeedbackDto }];
}>();

const { $productRepository } = useNuxtApp();
const { uploadFiles, isUploading, error: uploadError } = useUploadFiles();

const modalRef = ref<InstanceType<typeof MoleculesCommonModal>>();
const feedback = ref<TFeedbackManagementItem | null>(null);
const presetProduct = ref<{ id: number; name: string } | null>(null);
const productKeyword = ref("");
const productOptions = ref<{ label: string; value: number }[]>([]);
const existingImages = ref<string[]>([]);
const newFiles = ref<File[]>([]);
const errorMessage = ref("");

const form = reactive({
  productId: "" as string | number,
  displayName: "",
  score: 5,
  comment: "",
});

const isEditMode = computed(() => Boolean(feedback.value?._id));
const isBusy = computed(() => submitting || isUploading.value);
const productLabel = computed(() => {
  if (presetProduct.value?.name) {
    return presetProduct.value.name;
  }

  if (feedback.value?.seededProduct?.name) {
    return feedback.value.seededProduct.name;
  }

  const firstItem = feedback.value?.purchaseOrder?.purchaseItems?.[0];
  if (firstItem?.product?.name) return firstItem.product.name;
  if (firstItem?.productId !== undefined) return `SP #${firstItem.productId}`;
  if (feedback.value?.productId) return `SP #${feedback.value.productId}`;
  return "Sản phẩm";
});

const canSubmit = computed(() => {
  if (!form.score) return false;
  const productId = presetProduct.value?.id ?? form.productId;
  if (!isEditMode.value && !productId) return false;
  if (!isEditMode.value && !form.displayName.trim()) return false;
  return Boolean(form.comment.trim() || existingImages.value.length || newFiles.value.length);
});

const resetForm = () => {
  feedback.value = null;
  presetProduct.value = null;
  productKeyword.value = "";
  productOptions.value = [];
  existingImages.value = [];
  newFiles.value = [];
  errorMessage.value = "";
  form.productId = "";
  form.displayName = "";
  form.score = 5;
  form.comment = "";
};

const searchProducts = async () => {
  try {
    errorMessage.value = "";
    const response = await $productRepository.getMany({
      page: 1,
      limit: 20,
      keyword: productKeyword.value.trim() || undefined,
    });
    productOptions.value = response.data.map((product) => ({
      label: `${product.name} (#${product._id})`,
      value: product._id!,
    }));
  } catch {
    errorMessage.value = "Không thể tải danh sách sản phẩm.";
  }
};

const openCreateModal = async (product?: { id: number; name: string }) => {
  resetForm();
  if (product) {
    presetProduct.value = product;
    form.productId = product.id;
    nextTick(() => modalRef.value?.openModal());
    return;
  }

  await searchProducts();
  nextTick(() => modalRef.value?.openModal());
};

const openEditModal = (item: TFeedbackManagementItem) => {
  resetForm();
  feedback.value = item;
  form.displayName = item.displayName || item.user?.name || "";
  form.score = item.score || 5;
  form.comment = item.comment || "";
  existingImages.value = [...(item.images || [])];
  nextTick(() => modalRef.value?.openModal());
};

const closeModal = () => {
  modalRef.value?.closeModal();
};

const onClose = () => {
  resetForm();
};

const submitForm = async () => {
  if (!canSubmit.value) {
    errorMessage.value = "Vui lòng nhập đủ số sao, tên hiển thị và nội dung hoặc ảnh.";
    return;
  }

  try {
    errorMessage.value = "";
    const uploadedImages = await uploadFiles(newFiles.value);
    const images = [...existingImages.value, ...uploadedImages];

    if (isEditMode.value && feedback.value) {
      const body: TAdminUpdateFeedbackDto = {
        score: form.score,
        comment: form.comment.trim() || undefined,
        images,
      };

      if (feedback.value.isAdminCreated) {
        body.displayName = form.displayName.trim() || "Khách hàng";
      }

      emit("update", { id: feedback.value._id, body });
      return;
    }

    emit("create", {
      productId: Number(presetProduct.value?.id ?? form.productId),
      score: form.score,
      comment: form.comment.trim() || undefined,
      images,
      displayName: form.displayName.trim() || "Khách hàng",
    });
  } catch {
    errorMessage.value = uploadError.value || "Tải ảnh thất bại.";
  }
};

const setError = (message: string) => {
  errorMessage.value = message;
};

defineExpose({
  openCreateModal,
  openEditModal,
  closeModal,
  setError,
});
</script>
