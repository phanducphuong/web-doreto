import type { TExistedEntity } from "~/types/base.type";
import type { TPaginateRequest } from "~/types/fetch.type";
import type { TPurchaseItem, PurchaseOrderStatus } from "~/types/purchase-order.type";
import type { TUser } from "~/types/user.type";

export type TFeedbackAuthor = Partial<Pick<TUser, "name" | "email" | "role">> & {
  _id?: string | number;
  id?: string | number;
  avatar?: string;
  avatarUrl?: string;
};

export type TFeedbackReply = {
  content?: string;
  images: string[];
  createdAt?: string;
  admin?: TFeedbackAuthor;
};

export type TFeedbackPurchaseOrder = {
  _id: string;
  purchaseItems: TPurchaseItem[];
  status?: PurchaseOrderStatus | string;
  createdAt?: string;
};

export type TFeedback = TExistedEntity & {
  purchaseOrderId?: string | TFeedbackPurchaseOrder;
  userId?: string | number | TFeedbackAuthor;
  productId?: number;
  displayName?: string;
  isAdminCreated?: boolean;
  comment?: string;
  score?: number;
  images: string[];
  adminReply?: string;
  replyImages?: string[];
  repliedAt?: string;
  repliedBy?: TFeedbackAuthor;
  isActive?: boolean;
};

export type TFeedbackSummary = {
  averageRating: number;
  ratingCount: number;
};

export type TFeedbackAverageResponse = Partial<TFeedbackSummary> & {
  average?: number;
  count?: number;
};

export type TCreateOrUpdateFeedbackDto = {
  purchaseOrderId: string;
  comment?: string;
  score?: number;
  images?: string[];
};

export type TReplyFeedbackDto = {
  content?: string;
  images?: string[];
};

export type TFeedbackManagementReplyStatus = "replied" | "unreplied";

export type TFeedbackManagementQueryParams = TPaginateRequest & {
  score?: 1 | 2 | 3 | 4 | 5;
  replyStatus?: TFeedbackManagementReplyStatus;
  reviewerKeyword?: string;
  hasImage?: 1 | 0;
};

export type TFeedbackManagementItem = {
  _id: string;
  comment?: string;
  images?: string[];
  score?: number;
  adminReply?: string;
  replyImages?: string[];
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
  purchaseOrderId?: string;
  userId?: string;
  productId?: number;
  displayName?: string;
  isAdminCreated?: boolean;
  user?: {
    _id: string;
    name?: string;
    email?: string;
  };
  purchaseOrder?: {
    _id: string;
    status?: PurchaseOrderStatus | string;
    purchaseItems?: TPurchaseItem[];
    createdAt?: string;
  };
  seededProduct?: {
    _id: number;
    name?: string;
  };
  repliedBy?: {
    _id: string;
    name?: string;
    email?: string;
  };
};

export type TAdminCreateFeedbackDto = {
  productId: number;
  score: number;
  comment?: string;
  images?: string[];
  displayName?: string;
};

export type TAdminUpdateFeedbackDto = {
  score?: number;
  comment?: string;
  images?: string[];
  displayName?: string;
};

export type TFeedbackManagementResponse = {
  data: TFeedbackManagementItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type TFeedbackComposerPayload = {
  comment?: string;
  score?: number;
  existingImages: string[];
  newFiles: File[];
};

export type TFeedbackReplyPayload = {
  content?: string;
  existingImages: string[];
  newFiles: File[];
};

export type TFeedbackReplyMutationResponse =
  | TFeedback
  | {
      reply: TFeedbackReply;
    };
