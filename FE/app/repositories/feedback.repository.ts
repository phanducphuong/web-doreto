import type {
  TAdminCreateFeedbackDto,
  TAdminUpdateFeedbackDto,
  TCreateOrUpdateFeedbackDto,
  TFeedback,
  TFeedbackAverageResponse,
  TFeedbackManagementQueryParams,
  TFeedbackManagementResponse,
  TFeedbackReplyMutationResponse,
  TReplyFeedbackDto,
} from "~/types/feedback.type";

const createFeedbackRepository = ($api: typeof $fetch) => ({
  getProductFeedbacks: (productId: number | string) =>
    $api<TFeedback[]>(`/feedback-products/product/${productId}`),

  getProductFeedbackAverage: (productId: number | string) =>
    $api<TFeedbackAverageResponse>(`/feedback-products/product/${productId}/average`),

  getMyFeedback: async (productId: number | string) => {
    const response = await $api<TFeedback[]>(`/feedback-products/my/${productId}`);
    return response[0];
  },

  getManagementFeedbacks: (params: TFeedbackManagementQueryParams) =>
    $api<TFeedbackManagementResponse>("/feedback-products/management", {
      method: "GET",
      query: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        ...(params.score ? { score: params.score } : {}),
        ...(params.replyStatus ? { replyStatus: params.replyStatus } : {}),
        ...(params.reviewerKeyword?.trim()
          ? { reviewerKeyword: params.reviewerKeyword.trim() }
          : {}),
        ...(params.hasImage !== undefined ? { hasImage: params.hasImage } : {}),
      },
    }),

  upsertFeedback: (body: TCreateOrUpdateFeedbackDto) =>
    $api<TFeedback>("/feedback-products", {
      method: "POST",
      body,
    }),

  adminCreateFeedback: (body: TAdminCreateFeedbackDto) =>
    $api<TFeedback>("/feedback-products/admin", {
      method: "POST",
      body,
    }),

  adminUpdateFeedback: (feedbackId: string, body: TAdminUpdateFeedbackDto) =>
    $api<TFeedback>(`/feedback-products/${feedbackId}`, {
      method: "PATCH",
      body,
    }),

  replyFeedback: (feedbackId: string, body: TReplyFeedbackDto) => {
    return $api<TFeedbackReplyMutationResponse>(`/feedback-products/${feedbackId}/reply`, {
      method: "PATCH",
      body,
    });
  },
  deleteFeedback: (feedbackId: string | number) =>
    $api<void>(`/feedback-products/${feedbackId}`, {
      method: "DELETE",
    }),
});

export default createFeedbackRepository;
