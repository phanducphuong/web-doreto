<template>
  <section class="space-y-6">
    <div class="flex items-center justify-between gap-4">
      <h1 class="cms-title">Quản trị Feedback</h1>
    </div>

    <div
      class="flex flex-wrap items-end gap-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4"
    >
      <AtomsFormItem label="Điểm">
        <AtomsFormSelectBox
          v-model="scoreFilter"
          :options="scoreFilterOptions"
          placeholder="Tất cả"
          class="min-w-28"
        />
      </AtomsFormItem>

      <AtomsFormItem label="Trạng thái phản hồi">
        <AtomsFormSelectBox
          v-model="replyStatusFilter"
          :options="replyStatusOptions"
          placeholder="Tất cả"
          class="min-w-40"
        />
      </AtomsFormItem>

      <AtomsFormItem label="Ảnh đính kèm">
        <AtomsFormSelectBox
          v-model="hasImageFilter"
          :options="hasImageOptions"
          placeholder="Tất cả"
          class="min-w-36"
        />
      </AtomsFormItem>

      <AtomsFormItem label="Reviewer" class="min-w-64 flex-1">
        <AtomsFormInput
          v-model="reviewerKeywordInput"
          placeholder="Tên hoặc email reviewer"
          @keyup.enter="applyKeywordFilter"
        />
      </AtomsFormItem>

      <AtomsButton type="outline" :disabled="isFetching" @click="applyKeywordFilter"
        >Lọc</AtomsButton
      >
      <AtomsButton type="ghost" :disabled="isFetching" @click="resetFilters">Đặt lại</AtomsButton>
    </div>

    <AtomsUiInlineError :message="pageError" />

    <AtomsTable
      :columns="columns"
      :data="feedbacks"
      :pagination="pagination"
      :is-loading="isFetching"
      disable-row-select
      @change="onPageChange"
    >
      <template #product="{ row }">
        <template v-if="row.seededProduct?.name || row.productId">
          <NuxtLink
            :to="{
              name: 'chi-tiet-san-pham',
              params: {
                slug: generateSlug(row.seededProduct?.name || `sp-${row.productId}`),
                id: row.seededProduct?._id || row.productId,
              },
            }"
            class="font-medium text-on-surface hover:(text-primary underline)"
          >
            {{ row.seededProduct?.name || `#${row.productId}` }}
          </NuxtLink>
        </template>
        <template v-else>
          <NuxtLink
            v-for="value in row.purchaseOrder?.purchaseItems || []"
            :key="`${row._id}-${value.productId}-${value.productOptionValueId}`"
            :to="{
              name: 'chi-tiet-san-pham',
              params: {
                slug: generateSlug(value.product?.name),
                id: value.productId,
              },
            }"
            class="font-medium text-on-surface hover:(text-primary underline)"
          >
            {{ value.product?.name || `#${value.productId}` }}
          </NuxtLink>
        </template>
      </template>

      <template #reviewer="{ row }">
        <div class="space-y-1">
          <p class="text-sm font-medium text-on-surface">
            {{ row.displayName || row.user?.name || "Ẩn danh" }}
          </p>
          <p class="text-xs text-on-surface-variant">
            {{
              row.isAdminCreated
                ? "Admin tạo"
                : row.user?.email || "Không có email"
            }}
          </p>
        </div>
      </template>

      <template #comment="{ row }">
        <AtomsTooltip :content="row.comment" :show-after="300">
          <p class="line-clamp-2 text-sm text-on-surface-variant">{{ row.comment || "—" }}</p>
        </AtomsTooltip>
      </template>

      <template #images="{ row }">
        <div class="flex items-center gap-2">
          <span class="text-xs text-on-surface-variant">{{ row.images?.length || 0 }} ảnh</span>
          <div v-if="row.images?.length" class="flex items-center gap-1">
            <a
              v-for="(image, idx) in row.images.slice(0, 2)"
              :key="`${row._id}-${idx}`"
              :href="image"
              target="_blank"
              rel="noreferrer"
              class="overflow-hidden rounded-md border border-outline-variant aspect-square w-full object-cover"
            >
              <NuxtImg :src="image" :width="32" :height="32" class="size-8 object-cover" />
            </a>
          </div>
        </div>
      </template>

      <template #status="{ row }">
        <div class="space-y-1">
          <span
            class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
            :class="
              row.adminReply ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            "
          >
            {{ row.adminReply ? "Replied" : "Unreplied" }}
          </span>
          <p v-if="row.repliedAt" class="text-xs text-on-surface-variant">
            {{ formatIsoDateTime(row.repliedAt) }}
          </p>
        </div>
      </template>

      <template #createdAt="{ row }">
        <p class="text-sm text-on-surface-variant">{{ formatIsoDateTime(row.createdAt) }}</p>
      </template>

      <template #actions="{ row }">
        <div class="flex flex-wrap items-center gap-2" @click.stop>
          <AtomsButton
            type="outline"
            class="min-h-8 text-xs"
            :disabled="isSaving"
            @click="openEditModal(row)"
          >
            Sửa
          </AtomsButton>
          <AtomsButton
            type="outline"
            class="min-h-8 text-xs text-danger"
            :disabled="isDeleting"
            @click="onDeleteFeedback(row)"
          >
            Xóa
          </AtomsButton>
          <AtomsButton
            type="primary"
            class="min-h-8 text-xs"
            :disabled="Boolean(row.adminReply) || isReplying"
            @click="openReplyModal(row)"
          >
            Reply
          </AtomsButton>
        </div>
      </template>
    </AtomsTable>

    <MoleculesFeedbackAdminFeedbackReplyModal
      ref="replyModalRef"
      :submitting="isReplying"
      @submit="onSubmitReply"
    />

    <MoleculesFeedbackAdminFeedbackFormModal
      ref="formModalRef"
      :submitting="isSaving"
      @update="onUpdateFeedback"
    />
  </section>
</template>

<script setup lang="ts">
import type {
  TAdminUpdateFeedbackDto,
  TFeedbackManagementItem,
  TFeedbackManagementQueryParams,
  TFeedbackManagementReplyStatus,
  TReplyFeedbackDto,
} from "~/types/feedback.type";
import type { TTableColumn, TTablePagination } from "~/types/table.type";
import { FEEDBACK_MESSAGES } from "~/constants/feedback.constant";
import { getApiErrorMessage } from "~/utils/api-error";
import MoleculesFeedbackAdminFeedbackReplyModal from "~/components/molecules/feedback/AdminFeedbackReplyModal.vue";
import MoleculesFeedbackAdminFeedbackFormModal from "~/components/molecules/feedback/AdminFeedbackFormModal.vue";

const route = useRoute();
const { updateQuery } = useUpdateRouteQuery();
const { $feedbackRepository } = useNuxtApp();
const toast = useToast();

const feedbacks = ref<TFeedbackManagementItem[]>([]);
const isFetching = ref(false);
const isReplying = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const pageError = ref("");
const replyModalRef = ref<InstanceType<typeof MoleculesFeedbackAdminFeedbackReplyModal>>();
const formModalRef = ref<InstanceType<typeof MoleculesFeedbackAdminFeedbackFormModal>>();

const pagination = ref<TTablePagination>({
  page: 1,
  totalPage: 0,
  total: 0,
  count: 0,
});

const scoreOptions = [1, 2, 3, 4, 5] as const;

const scoreFilter = ref<string>("");
const replyStatusFilter = ref<"" | TFeedbackManagementReplyStatus>("");
const hasImageFilter = ref<"" | "1" | "0">("");
const reviewerKeywordInput = ref("");

const scoreFilterOptions = computed(() => [
  { label: "Tất cả", value: "" },
  ...scoreOptions.map((score) => ({
    label: `${score} sao`,
    value: String(score),
  })),
]);

const replyStatusOptions = [
  { label: "Tất cả", value: "" },
  { label: "Đã phản hồi", value: "replied" },
  { label: "Chưa phản hồi", value: "unreplied" },
];

const hasImageOptions = [
  { label: "Tất cả", value: "" },
  { label: "Có ảnh", value: "1" },
  { label: "Không ảnh", value: "0" },
];

const columns = reactive<TTableColumn<TFeedbackManagementItem>[]>([
  { key: "product", title: "Sản phẩm", slotKey: "product", colClass: "w-[16%]" },
  { key: "reviewer", title: "Khách hàng", slotKey: "reviewer", colClass: "w-[16%]" },
  { key: "score", title: "Số sao", center: true },
  { key: "comment", title: "Bình luận", slotKey: "comment", colClass: "w-[18%]" },
  { key: "images", title: "Ảnh", slotKey: "images", colClass: "w-[12%]" },
  { key: "status", title: "Trạng thái phản hồi", slotKey: "status", colClass: "w-[12%]" },
  { key: "createdAt", title: "Ngày tạo", slotKey: "createdAt", colClass: "w-[12%]" },
  { key: "actions", title: "Thao tác", slotKey: "actions", colClass: "w-[14%]" },
]);

const queryParams = computed<TFeedbackManagementQueryParams>(() => ({
  page: parseNumber(route.query.page, 1),
  limit: parseNumber(route.query.limit, 20),
  score: parseNumber(route.query.score) as 1 | 2 | 3 | 4 | 5 | undefined,
  replyStatus:
    route.query.replyStatus === "replied" || route.query.replyStatus === "unreplied"
      ? (route.query.replyStatus as TFeedbackManagementReplyStatus)
      : undefined,
  reviewerKeyword:
    typeof route.query.reviewerKeyword === "string" ? route.query.reviewerKeyword : undefined,
  hasImage: route.query.hasImage === "1" ? 1 : route.query.hasImage === "0" ? 0 : undefined,
}));

const syncFilterFromRoute = () => {
  scoreFilter.value = queryParams.value.score ? String(queryParams.value.score) : "";
  replyStatusFilter.value = queryParams.value.replyStatus || "";
  hasImageFilter.value =
    queryParams.value.hasImage !== undefined
      ? (String(queryParams.value.hasImage) as "1" | "0")
      : "";
  reviewerKeywordInput.value = queryParams.value.reviewerKeyword || "";
};

const fetchManagementFeedbacks = async () => {
  try {
    isFetching.value = true;
    pageError.value = "";
    const response = await $feedbackRepository.getManagementFeedbacks(queryParams.value);
    feedbacks.value = response.data;
    pagination.value = {
      page: response.page,
      totalPage: response.totalPages,
      total: response.total,
      count: response.limit,
    };
  } catch (error) {
    const message = getApiErrorMessage(error, FEEDBACK_MESSAGES.loadManagementFailed);
    pageError.value = message;
    feedbacks.value = [];
    toast.error({ message });
  } finally {
    isFetching.value = false;
  }
};

const onFilterChange = () => {
  updateQuery({
    page: 1,
    score: scoreFilter.value || undefined,
    replyStatus: replyStatusFilter.value || undefined,
    hasImage: hasImageFilter.value || undefined,
  });
};

const applyKeywordFilter = () => {
  updateQuery({
    page: 1,
    reviewerKeyword: reviewerKeywordInput.value.trim() || undefined,
  });
};

const resetFilters = () => {
  scoreFilter.value = "";
  replyStatusFilter.value = "";
  hasImageFilter.value = "";
  reviewerKeywordInput.value = "";
  updateQuery({
    page: 1,
    score: undefined,
    replyStatus: undefined,
    hasImage: undefined,
    reviewerKeyword: undefined,
  });
};

const onPageChange = (page: number) => {
  updateQuery({ page });
};

const openReplyModal = (item: TFeedbackManagementItem) => {
  replyModalRef.value?.openModal(item);
};

const openEditModal = (item: TFeedbackManagementItem) => {
  formModalRef.value?.openEditModal(item);
};

const onUpdateFeedback = async (payload: { id: string; body: TAdminUpdateFeedbackDto }) => {
  try {
    isSaving.value = true;
    await $feedbackRepository.adminUpdateFeedback(payload.id, payload.body);
    formModalRef.value?.closeModal();
    toast.success({ message: "Cập nhật đánh giá thành công." });
    await fetchManagementFeedbacks();
  } catch (error) {
    const message = getApiErrorMessage(error, "Cập nhật đánh giá thất bại.");
    formModalRef.value?.setError(message);
    toast.error({ message });
  } finally {
    isSaving.value = false;
  }
};

const onDeleteFeedback = async (item: TFeedbackManagementItem) => {
  const confirmed = window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?");
  if (!confirmed) return;

  try {
    isDeleting.value = true;
    await $feedbackRepository.deleteFeedback(item._id);
    toast.success({ message: "Xóa đánh giá thành công." });
    await fetchManagementFeedbacks();
  } catch (error) {
    toast.error({ message: getApiErrorMessage(error, "Xóa đánh giá thất bại.") });
  } finally {
    isDeleting.value = false;
  }
};

const onSubmitReply = async (payload: { id: string; body: TReplyFeedbackDto }) => {
  try {
    isReplying.value = true;
    await $feedbackRepository.replyFeedback(payload.id, payload.body);
    replyModalRef.value?.closeModal();
    toast.success({ message: "Phản hồi feedback thành công." });
    await fetchManagementFeedbacks();
  } catch (error) {
    const message = getApiErrorMessage(error, "Phản hồi feedback thất bại.");
    replyModalRef.value?.setError(message);
    toast.error({ message });
  } finally {
    isReplying.value = false;
  }
};

watch(
  () => route.query,
  () => {
    syncFilterFromRoute();
    fetchManagementFeedbacks();
  },
  { immediate: true },
);

watch([scoreFilter, replyStatusFilter, hasImageFilter], () => {
  onFilterChange();
});
</script>
