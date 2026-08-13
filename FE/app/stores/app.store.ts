import type { TProductQueryParams } from "~/types/product.type";

// QUAN TRỌNG (SSR): mỗi request phải có BẢN SAO riêng, không dùng chung object cấp module.
// Trước đây ref(objectSingleton) khiến store của khách A và khách B cùng trỏ 1 object →
// bộ lọc/sắp xếp của người này rò sang người kia (và có thể bị cache CDN đóng băng sai).
// Dùng factory trả object mới mỗi lần khởi tạo store.
const createLayoutInitialStates = () => ({
  layoutWeb: {
    filter: {
      category: true,
      filter: true,
      sort: true,
    },
  },
});

const createProductQueryInitialState = (): TProductQueryParams => ({
  sortBy: "purchaseCount",
  page: 1,
  limit: 8,
  minPrice: undefined,
  maxPrice: undefined,
  sortOrder: "desc",
});

export const useAppStore = defineStore("app", () => {
  const layoutConfig = ref(createLayoutInitialStates());
  const productQuery = ref(createProductQueryInitialState());

  return {
    layoutConfig,
    productQuery,
  };
});
