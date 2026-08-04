<template>
  <section class="space-y-4 sm:space-y-5 md:space-y-6">
    <FeedbackSummary :summary="summary" :is-loading="isLoadingSummary" :error="summaryError" />

    <div
      class="grid gap-4 sm:gap-5 md:gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)] xl:items-start"
      :class="{ '!xl:grid-cols-[minmax(0,1fr)]': !showComposer }"
    >
      <div v-if="showComposer || myFeedbackError" class="space-y-3 sm:space-y-4 xl:sticky xl:top-6">
        <AtomsUiInlineError :message="myFeedbackError" />

        <FeedbackComposer
          :feedback="myFeedback"
          :title="composerTitle"
          :helper-text="composerHelper"
          :submit-label="composerSubmitLabel"
          :error="composerError"
          :is-submitting="isComposerSubmitting"
          :disabled="isComposerDisabled"
          :has-purchased="hasPurchased"
          :purchased-option-labels="purchasedOptionLabels"
          @submit="handleComposerSubmit"
        />
      </div>

      <FeedbackList
        :items="feedbacks"
        :current-user-id="currentUserId"
        :is-admin="isAdmin"
        :is-loading="isLoadingList"
        :error="listError"
        :replying-id="replyingId"
        :deleting-id="deletingId"
        :reply-errors="replyErrors"
        :delete-errors="deleteErrors"
        @retry="refreshAll"
        @reply="handleReplySubmit"
        @delete="handleDelete"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { FEEDBACK_MESSAGES } from "~/constants/feedback.constant";
import type {
  TFeedback,
  TFeedbackComposerPayload,
  TFeedbackReplyPayload,
} from "~/types/feedback.type";
import { getEntityId, isAdminUser } from "~/utils/feedback.utils";
import FeedbackComposer from "~/components/molecules/feedback/FeedbackComposer.vue";
import FeedbackList from "~/components/molecules/feedback/FeedbackList.vue";
import FeedbackSummary from "~/components/molecules/feedback/FeedbackSummary.vue";

const props = defineProps<{
  productId: number | string;
  productName?: string;
}>();

const authStore = useAuthStore();
const { isLogin, user } = storeToRefs(authStore);

const productId = computed(() => props.productId);
const productName = computed(() => props.productName?.trim() || "");
const currentUserId = computed(() => getEntityId(user.value));
const isAdmin = computed(() => isAdminUser(user.value));

const { feedbacks, isLoadingList, isLoadingSummary, listError, refresh, summary, summaryError } =
  useProductFeedbacks(productId);

const {
  canManageFeedback,
  eligiblePurchaseOrderId,
  error: myFeedbackError,
  fetchMyFeedback,
  hasPurchased,
  isLoading: isLoadingMyFeedback,
  purchasedOptionLabels,
  myFeedback,
} = useMyFeedback(productId);

const {
  error: composerError,
  isSubmitting: isComposerSubmitting,
  submitFeedback,
} = useCreateOrUpdateFeedback({
  productId,
  purchaseOrderId: eligiblePurchaseOrderId,
  feedbacks,
  myFeedback,
  canManageFeedback,
  refreshSummary: async () => {
    await refresh();
  },
});

const {
  deletingId,
  deleteFeedback,
  errorById: deleteErrors,
} = useDeleteFeedback({
  feedbacks,
  myFeedback,
  refreshSummary: async () => {
    await refresh();
  },
});

const {
  errorById: replyErrors,
  replyingId,
  submitReply,
} = useReplyFeedback({
  feedbacks,
});

const showComposer = computed(() => Boolean(isLogin.value && !isAdmin.value && !myFeedback.value));

const composerTitle = "Viết đánh giá sản phẩm";
const composerSubmitLabel = "Gửi đánh giá";

const composerHelper = computed(() => {
  if (!isLogin.value) return FEEDBACK_MESSAGES.authRequired;
  if (isAdmin.value) return FEEDBACK_MESSAGES.adminReadonly;
  if (isLoadingMyFeedback.value) return "Đang kiểm tra quyền đánh giá của tài khoản này...";
  if (!hasPurchased.value) return FEEDBACK_MESSAGES.purchaseRequired;
  return "Bạn có thể gửi đánh giá kèm nhiều ảnh thực tế. Tất cả xử lý đều hiển thị trực tiếp trong phần này.";
});

const isComposerDisabled = computed(() =>
  Boolean(isLoadingMyFeedback.value || !hasPurchased.value),
);

const refreshAll = async () => {
  await Promise.all([refresh(), fetchMyFeedback()]);
};

const handleComposerSubmit = async (payload: TFeedbackComposerPayload) => {
  await submitFeedback(payload);
  await fetchMyFeedback();
};

const handleReplySubmit = async (payload: {
  feedback: TFeedback;
  payload: TFeedbackReplyPayload;
}) => {
  await submitReply(payload.feedback, payload.payload);
};

const handleDelete = async (feedback: TFeedback) => {
  const deleted = await deleteFeedback(feedback);
  if (deleted) {
    await fetchMyFeedback();
  }
};
</script>
