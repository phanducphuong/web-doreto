import { FEEDBACK_MESSAGES } from "~/constants/feedback.constant";
import type {
  TFeedback,
  TFeedbackReply,
  TFeedbackReplyMutationResponse,
  TFeedbackReplyPayload,
} from "~/types/feedback.type";
import { getApiErrorMessage } from "~/utils/api-error";
import {
  getFeedbackReply,
  hasContent,
  isFeedbackRecord,
  resolveReplyFromMutation,
  upsertFeedbackInList,
} from "~/utils/feedback.utils";

type TReplyFeedbackOptions = {
  feedbacks: Ref<TFeedback[]>;
};

export default function useReplyFeedback(options: TReplyFeedbackOptions) {
  const { $feedbackRepository } = useNuxtApp();
  const { uploadFiles, isUploading, error: uploadError } = useUploadFiles();

  const replyingId = ref<string>("");
  const errorById = ref<Record<string, string>>({});

  const setError = (feedbackId: string, message: string) => {
    errorById.value = {
      ...errorById.value,
      [feedbackId]: message,
    };
  };

  const clearError = (feedbackId: string) => {
    const next = { ...errorById.value };
    delete next[feedbackId];
    errorById.value = next;
  };

  const submitReply = async (
    feedback: TFeedback,
    payload: TFeedbackReplyPayload,
  ): Promise<TFeedbackReply | null> => {
    const feedbackId = String(feedback._id);

    if (getFeedbackReply(feedback)) {
      setError(feedbackId, FEEDBACK_MESSAGES.replyLocked);
      return null;
    }

    if (
      !hasContent(payload.content) &&
      payload.existingImages.length === 0 &&
      !payload.newFiles.length
    ) {
      setError(feedbackId, FEEDBACK_MESSAGES.invalidReply);
      return null;
    }

    try {
      replyingId.value = feedbackId;
      clearError(feedbackId);

      const uploadedUrls = await uploadFiles(payload.newFiles);
      const body = {
        content: payload.content,
        images: [...payload.existingImages, ...uploadedUrls],
      };
      const response: TFeedbackReplyMutationResponse = await $feedbackRepository.replyFeedback(
        feedbackId,
        body,
      );

      if (isFeedbackRecord(response)) {
        options.feedbacks.value = upsertFeedbackInList(options.feedbacks.value, response);
        return getFeedbackReply(response);
      }

      const localReply = resolveReplyFromMutation(response, {
        content: body.content,
        createdAt: new Date().toISOString(),
        images: body.images,
      });

      options.feedbacks.value = options.feedbacks.value.map((item) => {
        if (String(item._id) !== feedbackId) return item;
        return {
          ...item,
          adminReply: localReply.content,
          replyImages: localReply.images,
          repliedAt: localReply.createdAt || new Date().toISOString(),
        };
      });

      return localReply;
    } catch (replyError) {
      setError(
        feedbackId,
        uploadError.value || getApiErrorMessage(replyError, FEEDBACK_MESSAGES.invalidReply),
      );
      return null;
    } finally {
      replyingId.value = "";
    }
  };

  return {
    clearError,
    errorById,
    replyingId: computed(() => replyingId.value),
    submitReply,
    uploading: computed(() => isUploading.value),
  };
}
