<template>
  <div class="w-full min-h-600px space-y-4 md:space-y-6">
    <AtomsBreadCrumb
      v-if="route.name === 'danh-muc'"
      :breadcrumbs="pageBreadcrumbs"
      class="mb-1 md:mb-2"
    />

    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <!-- * PAGE - HEADER -->
      <h1 class="text-2xl text-on-surface font-semibold md:cms-title">{{ headLabel }}</h1>

      <MoleculesProductSort v-if="total" class="h-fit self-start sm:self-auto" />
    </div>

    <AtomsUiEmptyProducts
      v-if="!listProducts.length && status != 'pending'"
      class="py-10 md:py-16"
    />

    <!-- * RENDER LIST -->
    <!-- Mobile: thẻ trắng tràn sát 2 mép màn hình như trang chi tiết sản phẩm -->
    <div
      v-else
      class="grid grid-cols-2 gap-2 -mx-2.5 sm:(mx-0 gap-x-5 gap-y-10) md:(gap-x-6 gap-y-12) lg:grid-cols-3 xl:(grid-cols-4 gap-y-16)"
    >
      <MoleculesProductCard
        v-for="product in listProducts"
        :key="product._id"
        :product="product"
        flush
        class="overflow-hidden rounded-lg bg-white pb-2.5 sm:rounded-xl"
      />
    </div>

    <!-- * INFINITE SCROLL SENTINEL -->
    <div ref="targetRef" class="h-1 w-full" />
    <div
      v-if="isLoadingMore"
      class="flex items-center justify-center gap-2 py-4 text-sm text-neutral/80"
    >
      <span
        class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
      />
      Đang tải thêm sản phẩm...
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TExistedProduct } from "~/types/product.type";

const { productQuery } = storeToRefs(useAppStore());
const { categories } = storeToRefs(useCategoryStore());
const { $productRepository } = useNuxtApp();
const route = useRoute();

if (route.name === "danh-muc") {
  const { id } = route.params;
  if (id) productQuery.value.categoryId = String(id);
} else {
  productQuery.value.categoryId = undefined;
}

productQuery.value.page = 1;

// * COMPUTED
const total = computed(() => products.value?.total || 0);
const hasMore = computed(() => listProducts.value.length < total.value);
const headLabel = computed(() => {
  if (route.name === "danh-muc") {
    const category = categories.value.find((cat) => cat._id === route.params.id);
    return category?.name;
  }
  return "Tất cả sản phẩm";
});
const pageBreadcrumbs = computed(() => [
  { label: "Trang chủ", to: "/" },
  { label: "Sản phẩm", to: "/san-pham" },
  { label: headLabel.value || "Danh mục" },
]);

useSeoMeta({
  title: () => `${headLabel.value || "Sản phẩm"} | Doreto`,
  description: () =>
    route.name === "danh-muc"
      ? `Khám phá các sản phẩm thuộc danh mục ${headLabel.value || "đang cập nhật"} tại Doreto.`
      : "Khám phá toàn bộ sản phẩm thời trang tại Doreto.",
});

useBreadcrumbSchema(
  computed(() => {
    if (route.name === "danh-muc") {
      return [
        { name: "Trang chủ", path: "/" },
        { name: "Sản phẩm", path: "/san-pham" },
        { name: headLabel.value || "Danh mục", path: route.path },
      ];
    }

    return [
      { name: "Trang chủ", path: "/" },
      { name: "Sản phẩm", path: "/san-pham" },
    ];
  }),
);

// * INIT
const { data: products, status } = await useAsyncData(
  `${String(route.name)}-${String(route.query._q)}-${route.fullPath}`,
  () => $productRepository.getMany({ ...productQuery.value, page: 1 }),
  {
    watch: [productQuery],
  },
);

// * INFINITE SCROLL
// Danh sách tích lũy: trang 1 lấy từ useAsyncData (có SSR), các trang sau append khi cuộn.
const listProducts = ref<TExistedProduct[]>(products.value?.data || []);
const currentPage = ref(1);
// Tăng mỗi khi query đổi (filter/sort/danh mục) để bỏ kết quả load-more cũ đang bay dở.
let fetchVersion = 0;

watch(products, (res) => {
  listProducts.value = res?.data || [];
  currentPage.value = 1;
  fetchVersion++;
});

const loadMore = async () => {
  if (!hasMore.value || status.value === "pending") return;

  const version = fetchVersion;
  const res = await $productRepository.getMany({
    ...productQuery.value,
    page: currentPage.value + 1,
  });
  if (version !== fetchVersion) return;

  currentPage.value += 1;
  const existedIds = new Set(listProducts.value.map((product) => product._id));
  listProducts.value.push(...res.data.filter((product) => !existedIds.has(product._id)));
};

const { targetRef, isLoading: isLoadingMore } = useInfiniteScroll(loadMore, {
  canLoadMore: computed(() => hasMore.value && status.value !== "pending"),
  rootMargin: "0px 0px 400px 0px",
});
</script>
