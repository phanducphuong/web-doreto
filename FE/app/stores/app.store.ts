import type { TProductQueryParams } from "~/types/product.type";

const layoutInitalStates = {
  layoutWeb: {
    filter: {
      category: true,
      filter: true,
      sort: true,
    },
  },
};

const productQueryInitialState: TProductQueryParams = {
  sortBy: "purchaseCount",
  page: 1,
  limit: 8,
  minPrice: undefined,
  maxPrice: undefined,
  sortOrder: "desc",
};
export const useAppStore = defineStore("app", () => {
  const layoutConfig = ref(layoutInitalStates);
  const productQuery = ref(productQueryInitialState);

  return {
    layoutConfig,
    productQuery,
  };
});
