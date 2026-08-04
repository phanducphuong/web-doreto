<template>
  <div class="w-full min-h-600px space-y-4 md:space-y-6">
    <AtomsBreadCrumb :breadcrumbs="pageBreadcrumbs" class="mb-1 md:mb-2" />

    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl text-on-surface font-semibold md:cms-title">{{ headLabel }}</h1>
        <p v-if="listProducts.length && status != 'pending'" class="text-xs text-neutral/80 mt-1">
          Hiển thị {{ currentOrderNumber || 1 }} -
          {{ currentOrderNumber + listProducts.length }} trong tổng số
          {{ total }}
        </p>
      </div>

      <MoleculesProductSort v-if="total" class="h-fit self-start sm:self-auto" />
    </div>

    <AtomsUiEmptyProducts
      v-if="!listProducts.length && status != 'pending'"
      class="py-10 md:py-16"
    />

    <div
      v-else
      class="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 md:gap-x-6 md:gap-y-12 lg:grid-cols-3 xl:grid-cols-4 xl:gap-y-16"
    >
      <MoleculesProductCard v-for="product in listProducts" :key="product._id" :product="product" />
    </div>

    <MoleculesCommonPagination
      v-if="total > getSafeNumber(productQuery?.limit)"
      :total="total"
      :limit="getSafeNumber(productQuery.limit)"
      :page="getSafeNumber(productQuery.page)"
      @change="handlePaginationChange"
    />
  </div>
</template>

<script setup lang="ts">
import { getSafeNumber } from "~/utils/data.utils";

const route = useRoute();
const { productQuery } = storeToRefs(useAppStore());
const { $productRepository } = useNuxtApp();

const keyword = computed(() => String(route.query.q || "").trim());

// Search mode always uses keyword and clears category filter
productQuery.value.categoryId = undefined;
productQuery.value.keyword = keyword.value || undefined;
productQuery.value.page = 1;

const headLabel = computed(() => `Kết quả tìm kiếm cho "${keyword.value || "..."}"`);
const pageBreadcrumbs = computed(() => [
  { label: "Trang chủ", to: "/" },
  { label: "Tìm kiếm", to: "/tim-kiem" },
  { label: keyword.value || "Từ khóa" },
]);

useSeoMeta({
  title: () => `${headLabel.value} | Doreto`,
  description: () =>
    keyword.value
      ? `Khám phá các sản phẩm phù hợp với từ khóa "${keyword.value}" tại Doreto.`
      : "Khám phá các sản phẩm thời trang tại Doreto.",
});

useBreadcrumbSchema(
  computed(() => [
    { name: "Trang chủ", path: "/" },
    { name: "Tìm kiếm", path: "/tim-kiem" },
    { name: keyword.value || "Từ khóa", path: route.fullPath },
  ]),
);

watch(
  () => keyword.value,
  (value) => {
    productQuery.value.keyword = value || undefined;
    productQuery.value.page = 1;
  },
);

const total = computed(() => products.value?.total || 0);
const listProducts = computed(() => products.value?.data || []);
const currentOrderNumber = computed(
  () => (getSafeNumber(productQuery.value.page) - 1) * getSafeNumber(productQuery.value.limit),
);

const handlePaginationChange = (page: number) => {
  productQuery.value.page = page;
};

const { data: products, status } = await useAsyncData(
  () => `${String(route.name)}-${String(keyword.value)}-${String(productQuery.value.page)}`,
  () => $productRepository.getMany(productQuery.value),
  {
    watch: [productQuery, keyword],
  },
);
</script>
