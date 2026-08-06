import type { TPaginateResponse } from "~/types/fetch.type";
import repositoryFactory from "./repository.factory";
import type { TExistedProduct, TProductSuggestedQueryParams } from "~/types/product.type";

const createProductRepository = ($api: typeof $fetch) => ({
  ...repositoryFactory.create<TExistedProduct>($api, "/products"),
  getBySlug: async (slug: string) =>
    $api<TExistedProduct>(`/products/slug/${encodeURIComponent(slug)}`),
  checkSlugAvailable: async (slug: string, excludeId?: string) =>
    $api<{ slug: string; available: boolean; reason?: string }>(
      "/products/slug-available",
      { params: { slug, ...(excludeId ? { excludeId } : {}) } },
    ),
  getBestSellingProducts: async () =>
    $api<TPaginateResponse<TExistedProduct>>("/products/best-selling"),
  getRelatedProducts: async (productId: string) =>
    $api<TExistedProduct[]>("/products/related", {
      params: { productId },
    }),
  getSuggestedProducts: async (params: TProductSuggestedQueryParams) =>
    $api<TPaginateResponse<TExistedProduct>>("/products/suggested", {
      params,
    }),
  updateVirtualPurchaseCount: (productId: string, virtualPurchaseCount: number) =>
    $api<TExistedProduct>(`/products/${productId}/virtual-purchase-count`, {
      method: "PATCH",
      body: { virtualPurchaseCount },
    }),
});

export default createProductRepository;
