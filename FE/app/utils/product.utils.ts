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

export const generateProductSlug = (product: TExistedProduct) => {
  if (!product) return "";
  return `${generateSlug(product.name)}-I${product._id}`;
};
