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

  const feedbacks = ref<TFeedback[]>([]);
  const summary = ref<TFeedbackSummary>({ averageRating: 0, ratingCount: 0 });
  const isLoadingList = ref(false);
  const isLoadingSummary = ref(false);
  const listError = ref("");
  const summaryError = ref("");

  const listKey = computed(() => FEEDBACK_QUERY_KEYS.list(toValue(productId) || "unknown"));
  const summaryKey = computed(() => FEEDBACK_QUERY_KEYS.summary(toValue(productId) || "unknown"));

  const normalizedProductId = computed(() => {
    const value = toValue(productId);
    if (value === undefined || value === null || value === "") return null;

    // Id sản phẩm là UUID (Postgres); vẫn nhận id số của hệ cũ
    return String(value);
  });

  const fetchFeedbacks = async () => {
    if (normalizedProductId.value === null) {
      feedbacks.value = [];
      return;
    }

    try {
      void listKey.value;
      isLoadingList.value = true;
      listError.value = "";
      const response = await $feedbackRepository.getProductFeedbacks(normalizedProductId.value);
      feedbacks.value = sortFeedbacksByOldest(response);
    } catch (error) {
      listError.value = getApiErrorMessage(error, FEEDBACK_MESSAGES.loadListFailed);
    } finally {
      isLoadingList.value = false;
    }
  };

  const fetchSummary = async () => {
    if (normalizedProductId.value === null) {
      summary.value = { averageRating: 0, ratingCount: 0 };
      return;
    }

    try {
      void summaryKey.value;
      isLoadingSummary.value = true;
      summaryError.value = "";
      const response = await $feedbackRepository.getProductFeedbackAverage(
        normalizedProductId.value,
      );
      summary.value = normalizeFeedbackSummary(response);
    } catch (error) {
      summaryError.value = getApiErrorMessage(error, FEEDBACK_MESSAGES.loadSummaryFailed);
    } finally {
      isLoadingSummary.value = false;
    }
  };

  const refresh = async () => {
    await Promise.all([fetchFeedbacks(), fetchSummary()]);
  };

  const upsertLocalFeedback = (feedback: TFeedback) => {
    feedbacks.value = upsertFeedbackInList(feedbacks.value, feedback);
  };

  const removeLocalFeedback = (feedbackId: string | number) => {
    feedbacks.value = feedbacks.value.filter((item) => String(item._id) !== String(feedbackId));
  };

  watch(
    normalizedProductId,
    async (value) => {
      if (value === null) {
        feedbacks.value = [];
        summary.value = { averageRating: 0, ratingCount: 0 };
        return;
      }

      await refresh();
    },
    { immediate: true },
  );

  return {
    feedbacks,
    fetchFeedbacks,
    fetchSummary,
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
