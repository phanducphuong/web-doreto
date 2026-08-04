import type { TExistedCategory } from "~/types/category.type";

export const useCategoryStore = defineStore("category", () => {
  const loading = ref(false);
  const categories = ref<TExistedCategory[]>([]);
  const flatCategories = ref<TExistedCategory[]>([]);
  const categoryCount = ref<Record<string, number>>({});

  const { $categoryRepository } = useNuxtApp();

  // * HELPERS
  const formatCategories = (categories: TExistedCategory[] = []): TExistedCategory[] => {
    // const categoriesWithChildren = categories.map((category) => ({
    //   ...category,
    //   children: categories.filter((cat) => cat.parentId === category._id),
    // }));

    return categories.filter((cate) => !(cate as any).parentId);
  };

  // * METHODS
  const fetchCategories = async () => {
    try {
      loading.value = true;
      const res = await $categoryRepository.getAll();
      categories.value = formatCategories(res);
      flatCategories.value = res;
    } catch (error) {
      console.error("Failed to fetch categories", error);
    } finally {
      loading.value = false;
    }
  };

  const fetchCategoriesCount = async () => {
    try {
      const res = await $categoryRepository.getCategoryCount();
      categoryCount.value = res;
    } catch (error) {
      console.error("Failed to fetch categories count", error);
      categories.value = [];
    }
  };

  return {
    categoryCount,
    categories,
    flatCategories,
    loading,
    fetchCategories,
    fetchCategoriesCount,
  };
});
