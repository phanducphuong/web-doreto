import { PurchaseOrderStatus } from "~/types/purchase-order.type";
import type {
  TFeedback,
  TFeedbackAverageResponse,
  TFeedbackAuthor,
  TFeedbackPurchaseOrder,
  TFeedbackReply,
  TFeedbackReplyMutationResponse,
  TFeedbackSummary,
} from "~/types/feedback.type";
import { ERole, type TUser } from "~/types/user.type";

type TLooseUser = Partial<TUser> & {
  _id?: string | number;
  id?: string | number;
  avatar?: string;
  avatarUrl?: string;
  userName?: string;
};

export const getEntityId = (value: unknown): string => {
  if (typeof value !== "object" || value === null) return "";

  const record = value as Record<string, unknown>;
  const resolved = record._id ?? record.id;
  if (typeof resolved === "string" || typeof resolved === "number") {
    return String(resolved);
  }

  return "";
};

export const isAdminUser = (value: unknown): boolean => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return record.role === ERole.ADMIN;
};

export const getFeedbackAuthorName = (value: TLooseUser | undefined): string => {
  if (!value) return "Khách hàng";
  return value.name || value.userName || value.email || "Khách hàng";
};

export const getFeedbackAuthorInitials = (value: TLooseUser | undefined): string => {
  const name = getFeedbackAuthorName(value);
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase() || "")
    .join("");
};

/** Ẩn danh kiểu sàn TMĐT: P**c L**g */
export const maskFeedbackDisplayName = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return "***";

  const maskWord = (word: string): string => {
    const w = word.normalize("NFC");
    if (w.length <= 1) return "*";
    if (w.length === 2) return `${w[0]}*`;
    return `${w[0]}**${w[w.length - 1]}`;
  };

  return trimmed.split(/\s+/).filter(Boolean).map(maskWord).join(" ");
};

export const getFeedbackAvatarSrc = (value: TLooseUser | undefined): string => {
  if (!value) return "";
  return value.avatarUrl || value.avatar || "";
};

export const getFeedbackOptionLine = (feedback: TFeedback): string => {
  const matched = getFeedbackMatchedPurchaseItem(feedback);
  const names = matched?.productOptionValue?.productOptionNames?.filter(Boolean) ?? [];
  if (!names.length) return "";
  return names.join(", ");
};

export const getFeedbackPurchaseOrder = (
  feedback: TFeedback,
): TFeedbackPurchaseOrder | undefined => {
  return typeof feedback.purchaseOrderId === "object" && feedback.purchaseOrderId !== null
    ? (feedback.purchaseOrderId as TFeedbackPurchaseOrder)
    : undefined;
};

export const getFeedbackPurchaseOrderId = (feedback: TFeedback): string => {
  if (typeof feedback.purchaseOrderId === "string") return feedback.purchaseOrderId;
  if (
    typeof feedback.purchaseOrderId === "object" &&
    feedback.purchaseOrderId !== null &&
    typeof feedback.purchaseOrderId._id === "string"
  ) {
    return feedback.purchaseOrderId._id;
  }
  return "";
};

export const getFeedbackPurchaseItems = (feedback: TFeedback) => {
  return getFeedbackPurchaseOrder(feedback)?.purchaseItems ?? [];
};

export const getFeedbackProductId = (feedback: TFeedback): string => {
  if (feedback.productId !== undefined) {
    return String(feedback.productId);
  }

  const firstItem = getFeedbackPurchaseItems(feedback)[0];
  return firstItem?.productId !== undefined ? String(firstItem.productId) : "";
};

export const getFeedbackDisplayName = (feedback: TFeedback): string => {
  if (feedback.displayName?.trim()) {
    return feedback.displayName.trim();
  }

  return getFeedbackAuthorName(getFeedbackAuthor(feedback));
};

export const getFeedbackMatchedPurchaseItem = (feedback: TFeedback) => {
  const purchaseItems = getFeedbackPurchaseItems(feedback);
  if (!purchaseItems.length) return undefined;

  const productId = getFeedbackProductId(feedback);
  if (!productId) return purchaseItems[0];

  return (
    purchaseItems.find((item) => String(item.productId) === productId) ?? purchaseItems[0]
  );
};

export const getFeedbackAuthor = (feedback: TFeedback): TFeedbackAuthor | undefined => {
  if (typeof feedback.userId === "object" && feedback.userId !== null) {
    return feedback.userId as TFeedbackAuthor;
  }
  return undefined;
};

export const getFeedbackReply = (feedback: TFeedback): TFeedbackReply | null => {
  if (!feedback.adminReply && !feedback.repliedAt && !(feedback.replyImages?.length || 0)) {
    return null;
  }

  return {
    content: feedback.adminReply,
    images: feedback.replyImages ?? [],
    createdAt: feedback.repliedAt,
    admin: feedback.repliedBy,
  };
};

export const hasContent = (value?: string | null): boolean => Boolean(value?.trim());

export const isHttpErrorStatus = (error: unknown, status: number): boolean => {
  if (typeof error !== "object" || error === null) return false;
  const record = error as Record<string, unknown>;
  return record.status === status || record.statusCode === status;
};

export const sortFeedbacksByOldest = (items: TFeedback[]): TFeedback[] => {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.createdAt).getTime();
    const rightTime = new Date(right.createdAt).getTime();
    return leftTime - rightTime;
  });
};

export const formatFeedbackDate = (value?: string | null): string => {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export const normalizeFeedbackSummary = (
  value?: TFeedbackAverageResponse | null,
): TFeedbackSummary => {
  const average = Number(value?.averageRating ?? value?.average ?? 0);
  const count = Number(value?.ratingCount ?? value?.count ?? 0);

  return {
    averageRating: Number.isFinite(average) ? average : 0,
    ratingCount: Number.isFinite(count) ? count : 0,
  };
};

export const isPurchasedOrderStatus = (status: PurchaseOrderStatus): boolean => {
  return [
    PurchaseOrderStatus.CONFIRMED,
    PurchaseOrderStatus.SHIPPED,
    PurchaseOrderStatus.DELIVERED,
  ].includes(status);
};

export const upsertFeedbackInList = (items: TFeedback[], feedback: TFeedback): TFeedback[] => {
  const index = items.findIndex((item) => String(item._id) === String(feedback._id));

  if (index === -1) {
    return sortFeedbacksByOldest([feedback, ...items]);
  }

  const next = [...items];
  next[index] = feedback;
  return sortFeedbacksByOldest(next);
};

export const isFeedbackRecord = (value: unknown): value is TFeedback => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record._id === "string" || typeof record._id === "number";
};

export const resolveReplyFromMutation = (
  value: TFeedbackReplyMutationResponse,
  fallback: TFeedbackReply,
): TFeedbackReply => {
  if (isFeedbackRecord(value)) {
    return getFeedbackReply(value) ?? fallback;
  }

  return value.reply;
};
