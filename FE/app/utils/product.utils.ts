import type { TExistedProduct } from "~/types/product.type";

type TPurchaseCountProduct = Pick<
  TExistedProduct,
  "purchaseCount" | "virtualPurchaseCount"
>;

export const getDisplayPurchaseCount = (product?: TPurchaseCountProduct | null): number => {
  const realCount = Number(product?.purchaseCount ?? 0);
  const virtualCount = Number(product?.virtualPurchaseCount ?? 0);
  return realCount + virtualCount;
};

/** Rút gọn tên sản phẩm còn tối đa `maxWords` từ để hiển thị trong danh sách chọn. */
export const getShortProductName = (name?: string, maxWords = 6): string => {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")}…`;
};

/**
 * Đường dẫn slug cho URL /san-pham/:slug. Ưu tiên slug SEO do BE sinh; dự phòng
 * tra theo _id nếu SP chưa có slug (dữ liệu cũ chưa backfill) để không vỡ link.
 */
export const generateProductSlug = (product: TExistedProduct) => {
  if (!product) return "";
  return product.slug || String(product._id);
};
