import { FEEDBACK_MESSAGES } from "~/constants/feedback.constant";
import type { TFeedback } from "~/types/feedback.type";
import { getApiErrorMessage } from "~/utils/api-error";

type TDeleteFeedbackOptions = {
  feedbacks: Ref<TFeedback[]>;
  myFeedback: Ref<TFeedback | null>;
  refreshSummary: () => Promise<void>;
};

export default function useDeleteFeedback(options: TDeleteFeedbackOptions) {
  const { $feedbackRepository } = useNuxtApp();

  const deletingId = ref("");
  const errorById = ref<Record<string, string>>({});

  const clearError = (feedbackId: string) => {
    const next = { ...errorById.value };
    delete next[feedbackId];
    errorById.value = next;
  };

  const deleteFeedback = async (feedback: TFeedback): Promise<boolean> => {
    const feedbackId = String(feedback._id);

    try {
      deletingId.value = feedbackId;
      clearError(feedbackId);

      await $feedbackRepository.deleteFeedback(feedbackId);
      options.feedbacks.value = options.feedbacks.value.filter(
        (item) => String(item._id) !== feedbackId,
      );

      if (String(options.myFeedback.value?._id || "") === feedbackId) {
        options.myFeedback.value = null;
      }

      await options.refreshSummary();
      return true;
    } catch (deleteError) {
      errorById.value = {
        ...errorById.value,
        [feedbackId]: getApiErrorMessage(deleteError, FEEDBACK_MESSAGES.deleteFailed),
      };
      return false;
    } finally {
      deletingId.value = "";
    }
  };

  return {
    clearError,
    deleteFeedback,
    deletingId: computed(() => deletingId.value),
    errorById,
  };
}
