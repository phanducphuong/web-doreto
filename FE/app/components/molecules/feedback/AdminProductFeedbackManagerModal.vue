<template>
  <MoleculesCommonModal
    ref="modalRef"
    :header="modalHeader"
    :is-show-close="true"
    :width="760"
    :close-on-click-overlay="false"
  >
    <div class="space-y-4">
      <div
        class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3"
      >
        <div class="flex items-center gap-2 text-sm">
          <AtomsUiRating :rating="summary.averageRating" :truncate="false" />
          <span class="font-semibold text-on-surface">{{ averageLabel }}</span>
          <span class="text-on-surface-variant">· {{ summary.ratingCount }} đánh giá</span>
        </div>
        <AtomsButton type="primaryGradient" :icon="Plus" :disabled="isBusy" @click="openCreate">
          Thêm đánh giá
        </AtomsButton>
      </div>

      <AtomsUiInlineError :message="listError" />

      <div v-if="isLoadingList" class="py-10 text-center text-sm text-on-surface-variant">
        Đang tải danh sách đánh giá...
      </div>

      <div
        v-else-if="!feedbacks.length"
        class="rounded-xl border border-dashed border-outline-variant py-10 text-center text-sm text-on-surface-variant"
      >
        Chưa có đánh giá nào cho sản phẩm này.<br />Bấm "Thêm đánh giá" để tạo đánh giá đầu tiên.
      </div>

      <ul v-else class="space-y-3">
        <li
          v-for="item in feedbacks"
          :key="String(item._id)"
          class="rounded-xl border border-outline-variant p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 space-y-1.5">
              <div class="flex flex-wrap items-center gap-2">
                <p class="font-semibold text-on-surface">{{ resolveName(item) }}</p>
                <span
                  v-if="item.isAdminCreated"
                  class="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
                >
                  Admin tạo
                </span>
                <span class="text-xs text-on-surface-variant">
                  {{ formatFeedbackDate(item.createdAt) }}
                </span>
              </div>

              <AtomsUiRating :rating="item.score || 0" :truncate="false" />

              <p
                v-if="item.comment"
                class="text-sm leading-6 text-on-surface-variant whitespace-pre-line"
              >
                {{ item.comment }}
              </p>

              <div v-if="item.images?.length" class="flex flex-wrap gap-2 pt-1">
                <a
                  v-for="(image, idx) in item.images"
                  :key="`${item._id}-${idx}`"
                  :href="image"
                  target="_blank"
                  rel="noreferrer"
                  class="block size-14 overflow-hidden rounded-md border border-outline-variant"
                >
                  <NuxtImg :src="image" :width="56" :height="56" class="size-full object-cover" />
                </a>
              </div>
            </div>

            <div class="flex shrink-0 flex-col gap-2">
              <AtomsButton
                type="outline"
                class="min-h-8 text-xs"
                :disabled="isBusy"
                @click="openEdit(item)"
              >
                Sửa
              </AtomsButton>
              <AtomsButton
                type="outline"
                class="min-h-8 text-xs text-danger"
                :disabled="isBusy"
                :is-loading="deletingId === String(item._id)"
                @click="onDelete(item)"
              >
                Xóa
              </AtomsButton>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </MoleculesCommonModal>

  <MoleculesFeedbackAdminFeedbackFormModal
    ref="formModalRef"
    :submitting="isSaving"
    @create="onCreate"
    @update="onUpdate"
  />
</template>

<script setup lang="ts">
import type {
  TAdminCreateFeedbackDto,
  TAdminUpdateFeedbackDto,
  TFeedback,
  TFeedbackManagementItem,
} from "~/types/feedback.type";
import MoleculesCommonModal from "~/components/molecules/common/Modal.vue";
import MoleculesFeedbackAdminFeedbackFormModal from "~/components/molecules/feedback/AdminFeedbackFormModal.vue";
import { formatFeedbackDate, getFeedbackDisplayName } from "~/utils/feedback.utils";
import { getApiErrorMessage } from "~/utils/api-error";
import { Plus } from "lucide-vue-next";

const emit = defineEmits<{
  changed: [];
}>();

const { $feedbackRepository } = useNuxtApp();
const toast = useToast();

const modalRef = ref<InstanceType<typeof MoleculesCommonModal>>();
const formModalRef = ref<InstanceType<typeof MoleculesFeedbackAdminFeedbackFormModal>>();

const productId = ref<string | number | undefined>(undefined);
const productName = ref("");

const { feedbacks, summary, isLoadingList, listError, refresh } = useProductFeedbacks(productId);

const isSaving = ref(false);
const deletingId = ref("");

const isBusy = computed(() => isSaving.value || Boolean(deletingId.value));
const modalHeader = computed(() =>
  productName.value ? `Đánh giá — ${productName.value}` : "Quản lý đánh giá",
);
const averageLabel = computed(() => (summary.value.averageRating || 0).toFixed(1));

const resolveName = (item: TFeedback) => getFeedbackDisplayName(item) || "Ẩn danh";

// Map item list (TFeedback) sang shape mà form sửa cần (TFeedbackManagementItem)
const toManagementItem = (item: TFeedback): TFeedbackManagementItem => ({
  _id: String(item._id),
  displayName: getFeedbackDisplayName(item),
  score: item.score,
  comment: item.comment,
  images: item.images || [],
  isAdminCreated: item.isAdminCreated,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt || item.createdAt,
  seededProduct: { _id: 0, name: productName.value },
});

const openModal = (product: { id: string | number; name: string }) => {
  productName.value = product.name;
  productId.value = product.id;
  modalRef.value?.openModal();
  // Luôn tải lại để dữ liệu mới nhất (kể cả khi mở lại cùng sản phẩm)
  void refresh();
};

const closeModal = () => {
  modalRef.value?.closeModal();
};

const openCreate = () => {
  if (productId.value === undefined) return;
  formModalRef.value?.openCreateModal({ id: productId.value, name: productName.value });
};

const openEdit = (item: TFeedback) => {
  formModalRef.value?.openEditModal(toManagementItem(item));
};

const onCreate = async (body: TAdminCreateFeedbackDto) => {
  try {
    isSaving.value = true;
    await $feedbackRepository.adminCreateFeedback(body);
    formModalRef.value?.closeModal();
    toast.success({ message: "Tạo đánh giá thành công." });
    await refresh();
    emit("changed");
  } catch (error) {
    const message = getApiErrorMessage(error, "Tạo đánh giá thất bại.");
    formModalRef.value?.setError(message);
    toast.error({ message });
  } finally {
    isSaving.value = false;
  }
};

const onUpdate = async (payload: { id: string; body: TAdminUpdateFeedbackDto }) => {
  try {
    isSaving.value = true;
    await $feedbackRepository.adminUpdateFeedback(payload.id, payload.body);
    formModalRef.value?.closeModal();
    toast.success({ message: "Cập nhật đánh giá thành công." });
    await refresh();
    emit("changed");
  } catch (error) {
    const message = getApiErrorMessage(error, "Cập nhật đánh giá thất bại.");
    formModalRef.value?.setError(message);
    toast.error({ message });
  } finally {
    isSaving.value = false;
  }
};

const onDelete = async (item: TFeedback) => {
  const confirmed = window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?");
  if (!confirmed) return;

  try {
    deletingId.value = String(item._id);
    await $feedbackRepository.deleteFeedback(item._id);
    toast.success({ message: "Xóa đánh giá thành công." });
    await refresh();
    emit("changed");
  } catch (error) {
    toast.error({ message: getApiErrorMessage(error, "Xóa đánh giá thất bại.") });
  } finally {
    deletingId.value = "";
  }
};

defineExpose({
  openModal,
  closeModal,
});
</script>
