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
});

export default createPurchaseOrderRepository;
