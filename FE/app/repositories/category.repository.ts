import type { TExistedCategory } from "~/types/category.type";
import repositoryFactory from "./repository.factory";

const createCategoryRepository = ($api: typeof $fetch) => ({
  ...repositoryFactory.create<TExistedCategory>($api, "/categories"),
  getCategoryCount: async () => $api<{ count: number }>("/categories/count"),
});

export default createCategoryRepository;
