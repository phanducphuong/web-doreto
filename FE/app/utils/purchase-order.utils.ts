import { PurchaseOrderStatus } from "~/types/purchase-order.type";
import type { TExistedProduct, TOptionValue } from "~/types/product.type";

export type TBadgeType = "default" | "success" | "error" | "warning" | "info" | "neutral";

export const getPurchaseOrderStatusBadgeType = (status: PurchaseOrderStatus): TBadgeType => {
  switch (status) {
    case PurchaseOrderStatus.CANCELLED:
      return "error";
    case PurchaseOrderStatus.DELIVERED:
      return "success";
    case PurchaseOrderStatus.SHIPPED:
      return "info";
    case PurchaseOrderStatus.CONFIRMED:
      return "neutral";
    case PurchaseOrderStatus.CART:
      return "default";
    default:
      return "warning";
  }
};

export const getPurchaseOrderNextStatus = (
  currentStatus: PurchaseOrderStatus,
): PurchaseOrderStatus | undefined => {
  switch (currentStatus) {
    case PurchaseOrderStatus.PENDING:
      return PurchaseOrderStatus.CONFIRMED;
    case PurchaseOrderStatus.CONFIRMED:
      return PurchaseOrderStatus.SHIPPED;
    case PurchaseOrderStatus.SHIPPED:
      return PurchaseOrderStatus.DELIVERED;
    default:
      return undefined;
  }
};

export const canPurchaseOrderChangeNextStatus = (status: PurchaseOrderStatus) => {
  return !!getPurchaseOrderNextStatus(status);
};

export const getPurchaseOrderDetailText = (
  product: TExistedProduct,
  productOptionValue: TOptionValue,
) => {
  const options = product.productOptions || [];
  const values = productOptionValue.productOptionNames || [];

  if (!options.length || !values.length) return "";

  return options
    .map((opt, index) => {
      const value = values[index];
      if (!opt || !value) return null;
      return `${opt}: ${value}`;
    })
    .filter(Boolean)
    .join(", ");
};
