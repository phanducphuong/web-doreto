import { FEEDBACK_MESSAGES, FEEDBACK_QUERY_KEYS } from "~/constants/feedback.constant";
import type { TFeedback, TFeedbackSummary } from "~/types/feedback.type";
import { getApiErrorMessage } from "~/utils/api-error";
import {
  normalizeFeedbackSummary,
  sortFeedbacksByOldest,
  upsertFeedbackInList,
} from "~/utils/feedback.utils";

export default function useProductFeedbacks(
  productId: MaybeRefOrGetter<number | string | undefined>,
) {
  const { $feedbackRepository } = useNuxtApp();

  const normalizedProductId = computed(() => {
    const value = toValue(productId);
    if (value === undefined || value === null || value === "") return null;
    // Id sản phẩm là UUID (Postgres); vẫn nhận id số của hệ cũ
    return String(value);
  });

  const listKey = computed(() =>
    FEEDBACK_QUERY_KEYS.list(normalizedProductId.value || "unknown"),
  );
  const summaryKey = computed(() =>
    FEEDBACK_QUERY_KEYS.summary(normalizedProductId.value || "unknown"),
  );

  // Nạp bằng useAsyncData → chạy TRÊN SERVER (SSR) và chuyển payload xuống client,
  // không fetch lại khi hydrate. Trước đây dùng watch immediate (chỉ chạy ở client)
  // nên HTML SSR không có nội dung đánh giá → Google không thấy review + nhấp nháy skeleton.
  const {
    data: feedbacksData,
    pending: isLoadingList,
    error: listErrorRaw,
    refresh: refreshList,
  } = useAsyncData<TFeedback[]>(
    listKey.value,
    async () => {
      if (normalizedProductId.value === null) return [];
      const response = await $feedbackRepository.getProductFeedbacks(
        normalizedProductId.value,
      );
      return sortFeedbacksByOldest(response);
    },
    { default: () => [], watch: [normalizedProductId] },
  );

  const {
    data: summaryData,
    pending: isLoadingSummary,
    error: summaryErrorRaw,
    refresh: refreshSummary,
  } = useAsyncData<TFeedbackSummary>(
    summaryKey.value,
    async () => {
      if (normalizedProductId.value === null) {
        return { averageRating: 0, ratingCount: 0 };
      }
      const response = await $feedbackRepository.getProductFeedbackAverage(
        normalizedProductId.value,
      );
      return normalizeFeedbackSummary(response);
    },
    { default: () => ({ averageRating: 0, ratingCount: 0 }), watch: [normalizedProductId] },
  );

  // feedbacks/summary là ref có thể sửa cục bộ (khi khách vừa gửi/xóa đánh giá).
  const feedbacks = feedbacksData as Ref<TFeedback[]>;
  const summary = summaryData as Ref<TFeedbackSummary>;

  const listError = computed(() =>
    listErrorRaw.value
      ? getApiErrorMessage(listErrorRaw.value, FEEDBACK_MESSAGES.loadListFailed)
      : "",
  );
  const summaryError = computed(() =>
    summaryErrorRaw.value
      ? getApiErrorMessage(summaryErrorRaw.value, FEEDBACK_MESSAGES.loadSummaryFailed)
      : "",
  );

  const refresh = async () => {
    await Promise.all([refreshList(), refreshSummary()]);
  };

  const upsertLocalFeedback = (feedback: TFeedback) => {
    feedbacks.value = upsertFeedbackInList(feedbacks.value ?? [], feedback);
  };

  const removeLocalFeedback = (feedbackId: string | number) => {
    feedbacks.value = (feedbacks.value ?? []).filter(
      (item) => String(item._id) !== String(feedbackId),
    );
  };

  return {
    feedbacks,
    fetchFeedbacks: refreshList,
    fetchSummary: refreshSummary,
    isLoadingList,
    isLoadingSummary,
    listError,
    refresh,
    removeLocalFeedback,
    summary,
    summaryError,
    upsertLocalFeedback,
  };
}
