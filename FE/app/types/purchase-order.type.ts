import type { TExistedEntity } from "./base.type";
import type { TPaginateRequest } from "./fetch.type";
import type { TExistedProduct, TOptionValue } from "./product.type";
import type { TTrackingUtm } from "./tracking.type";
import type { TAddress, TUser } from "./user.type";

export enum PurchaseOrderStatus {
  CART = "cart",
  PENDING = "pending",
  CONFIRMED = "confirmed",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

export const PurchaseOrderStatusLabels = {
  [PurchaseOrderStatus.CART]: "Thêm vào giỏ hàng",
  [PurchaseOrderStatus.PENDING]: "Đang xử lý",
  [PurchaseOrderStatus.CONFIRMED]: "Đã xác nhận",
  [PurchaseOrderStatus.SHIPPED]: "Đang giao",
  [PurchaseOrderStatus.DELIVERED]: "Đã giao",
  [PurchaseOrderStatus.CANCELLED]: "Đã hủy",
};

export type TPurchaseItem = {
  productOptionValueId: string;
  productId: number | string;
  productOptionValue?: TOptionValue;
  product?: TExistedProduct;
  count: number;
  price: number;
};

export type TPurchaseOrder = {
  userId: string;
  addressId?: string;
  user?: TUser;
  purchaseItems: TPurchaseItem[];
  address?: TAddress;
  status: PurchaseOrderStatus;
  purchasePriceDetail: {
    summaryPrice: number;
  };
  deliveriedAt?: string;
  /** BE set true sau khi user gửi feedback cho đơn này */
  isFeedbacked?: boolean;
  // Attribution first-touch (phase 37) — optional, gửi kèm khi tạo/checkout đơn (D-05).
  visitorId?: string;
  camp?: string;
  utm?: TTrackingUtm;
};

export type TExistedPurchaseOrderQueryParams = TPaginateRequest & {
  keyword?: string;
  categoryId?: number;
  state?: PurchaseOrderStatus;
  fromDate?: string;
  toDate?: string;
  sortBy?: "price" | "updatedAt" | "purchaseCount";
  sortOrder?: "asc" | "desc";
};

export type TExistedPurchaseOrder = TPurchaseOrder & TExistedEntity;
