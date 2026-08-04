import { createAuthRepository } from "~/repositories/auth.repository";
import createCategoryRepository from "~/repositories/category.repository";
import { createContactRequestRepository } from "~/repositories/contact-request.repository";
import createFeedbackRepository from "~/repositories/feedback.repository";
import createImageFrameRepository from "~/repositories/image-frame.repository";
import createProductRepository from "~/repositories/product.repository";
import createPurchaseOrderRepository from "~/repositories/purchase-order.repository";
import createReportingRepository from "~/repositories/reporting.repository";
import createTagRepository from "~/repositories/tag.repository";
import createUploadRepository from "~/repositories/upload.repository";
import createUserManagementRepository from "~/repositories/user-management.repository";
import createUserProfileRepository from "~/repositories/user-profile.repository";

export default defineNuxtPlugin((nuxtApp) => {
  const $api = nuxtApp.$api as typeof $fetch;

  return {
    provide: {
      authRepository: createAuthRepository($api),
      categoryRepository: createCategoryRepository($api),
      productRepository: createProductRepository($api),
      feedbackRepository: createFeedbackRepository($api),
      imageFrameRepository: createImageFrameRepository($api),
      tagRepository: createTagRepository($api),
      uploadRepository: createUploadRepository($api),
      contactRequestRepository: createContactRequestRepository($api),
      purchaseOrderRepository: createPurchaseOrderRepository($api),
      reportingRepository: createReportingRepository($api),
      userManagementRepository: createUserManagementRepository($api),
      userProfileRepository: createUserProfileRepository($api),
    },
  };
});
