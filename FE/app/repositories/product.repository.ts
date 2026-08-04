import type { TPaginateResponse } from "~/types/fetch.type";
import repositoryFactory from "./repository.factory";
import type { TExistedProduct, TProductSuggestedQueryParams } from "~/types/product.type";

const createProductRepository = ($api: typeof $fetch) => ({
  ...repositoryFactory.create<TExistedProduct>($api, "/products"),
  getBestSellingProducts: async () =>
    $api<TPaginateResponse<TExistedProduct>>("/products/best-selling"),
  getRelatedProducts: async (productId: number) =>
    $api<TExistedProduct[]>("/products/related", {
      params: { productId },
    }),
  getSuggestedProducts: async (params: TProductSuggestedQueryParams) =>
    $api<TPaginateResponse<TExistedProduct>>("/products/suggested", {
      params,
    }),
  updateVirtualPurchaseCount: (productId: number, virtualPurchaseCount: number) =>
    $api<TExistedProduct>(`/products/${productId}/virtual-purchase-count`, {
      method: "PATCH",
      body: { virtualPurchaseCount },
    }),
});

export default createProductRepository;
