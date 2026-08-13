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

// Dòng mô tả cho CẢ GÓI combo: gộp giá trị từng thuộc tính của mọi sản phẩm trong gói.
// VD 2 sản phẩm khác màu cùng size: "Màu sắc: Xanh Đậm, Xanh Nhạt, Kích cỡ: M";
// nếu có màu trùng lặp giữa nhiều màu: "Màu sắc: Xanh Đậm ×2, Xanh Nhạt".
export const getComboGroupDetailText = (
  product: TExistedProduct,
  optionValues: TOptionValue[],
) => {
  const options = product.productOptions || [];
  if (!options.length || !optionValues.length) return "";

  return options
    .map((opt, index) => {
      if (!opt) return null;
      const counts = new Map<string, number>();
      for (const optionValue of optionValues) {
        const value = optionValue.productOptionNames?.[index];
        if (value) counts.set(value, (counts.get(value) || 0) + 1);
      }
      if (!counts.size) return null;
      // Mọi sản phẩm cùng 1 giá trị (VD cùng size) → ghi gọn, không cần ×n
      const allSame = counts.size === 1;
      const text = [...counts.entries()]
        .map(([value, count]) => (count > 1 && !allSame ? `${value} ×${count}` : value))
        .join(", ");
      return `${opt}: ${text}`;
    })
    .filter(Boolean)
    .join(", ");
};
