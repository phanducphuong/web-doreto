import { FEEDBACK_MESSAGES } from "~/constants/feedback.constant";
import type { TFeedback, TFeedbackComposerPayload } from "~/types/feedback.type";
import { getApiErrorMessage } from "~/utils/api-error";
import {
  getFeedbackPurchaseOrderId,
  hasContent,
  upsertFeedbackInList,
} from "~/utils/feedback.utils";

type TCreateOrUpdateFeedbackOptions = {
  productId: MaybeRefOrGetter<number | string | undefined>;
  purchaseOrderId: Ref<string> | ComputedRef<string>;
  feedbacks: Ref<TFeedback[]>;
  myFeedback: Ref<TFeedback | null>;
  canManageFeedback: Ref<boolean> | ComputedRef<boolean>;
  refreshSummary: () => Promise<void>;
};

export default function useCreateOrUpdateFeedback(options: TCreateOrUpdateFeedbackOptions) {
  const { $feedbackRepository } = useNuxtApp();
  const { uploadFiles, isUploading, error: uploadError } = useUploadFiles();

  const isSubmitting = ref(false);
  const error = ref("");

  const submitFeedback = async (payload: TFeedbackComposerPayload): Promise<TFeedback | null> => {
    const resolvedProductId = toValue(options.productId);

    if (!toValue(options.canManageFeedback)) {
      error.value = FEEDBACK_MESSAGES.purchaseRequired;
      return null;
    }

    if (!resolvedProductId) {
      error.value = FEEDBACK_MESSAGES.loadMineFailed;
      return null;
    }

    if (
      !hasContent(payload.comment) &&
      !payload.score &&
      payload.existingImages.length === 0 &&
      !payload.newFiles.length
    ) {
      error.value = FEEDBACK_MESSAGES.invalidComposer;
      return null;
    }

    try {
      isSubmitting.value = true;
      error.value = "";

      const uploadedUrls = await uploadFiles(payload.newFiles);
      const resolvedPurchaseOrderId =
        (options.myFeedback.value ? getFeedbackPurchaseOrderId(options.myFeedback.value) : "") ||
        toValue(options.purchaseOrderId);
      if (!resolvedPurchaseOrderId) {
        error.value = FEEDBACK_MESSAGES.purchaseRequired;
        return null;
      }
      const response = await $feedbackRepository.upsertFeedback({
        purchaseOrderId: resolvedPurchaseOrderId,
        comment: payload.comment,
        images: [...payload.existingImages, ...uploadedUrls],
        score: payload.score,
      });

      options.myFeedback.value = response;
      options.feedbacks.value = upsertFeedbackInList(options.feedbacks.value, response);
      await options.refreshSummary();
      return response;
    } catch (submitError) {
      error.value =
        uploadError.value || getApiErrorMessage(submitError, FEEDBACK_MESSAGES.loadMineFailed);
      return null;
    } finally {
      isSubmitting.value = false;
    }
  };

  const clearError = () => {
    error.value = "";
  };

  return {
    clearError,
    error,
    isSubmitting: computed(() => isSubmitting.value || isUploading.value),
    submitFeedback,
  };
}
