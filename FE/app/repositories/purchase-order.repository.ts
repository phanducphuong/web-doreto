import type { TExistedPurchaseOrder } from "~/types/purchase-order.type";
import repositoryFactory from "./repository.factory";
import type { TPaginateResponse } from "~/types/fetch.type";

const createPurchaseOrderRepository = ($api: typeof $fetch) => ({
  ...repositoryFactory.create<TExistedPurchaseOrder>($api, "/purchase-orders"),
  getPurchaseOrdersByUser: async (params?: { page: number; limit: number }) =>
    $api<TPaginateResponse<TExistedPurchaseOrder>>(`/purchase-orders/user`, {
      method: "get",
      params,
    }),
  // Đơn của user đủ điều kiện đánh giá 1 sản phẩm (BE lọc theo productId + trạng thái)
  getFeedbackEligibleOrders: async (productId: string) =>
    $api<TExistedPurchaseOrder[]>(`/purchase-orders/eligible-feedback`, {
      method: "get",
      params: { productId },
    }),
});

export default createPurchaseOrderRepository;
