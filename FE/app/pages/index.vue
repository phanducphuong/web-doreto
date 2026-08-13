<template>
  <div class="space-y-8 lg:space-y-14 w-full">
    <OrganismsBanner class="-mx-2.5 !w-auto sm:(mx-0 !w-full)" />

    <!-- * THÔNG TIN SHOP + ĐÁNH GIÁ CỬA HÀNG -->
    <OrganismsShopOverview class="-mx-2.5 sm:mx-0" />

    <!-- * DANH SÁCH SẢN PHẨM + BỘ LỌC (giống trang sản phẩm) -->
    <div>
      <div class="mb-4 flex flex-wrap items-end justify-between gap-3 md:mb-6">
        <h4 class="cms-title">Tất cả sản phẩm</h4>

        <NuxtLink
          to="/san-pham"
          class="flex items-center gap-1 border-(b white/50) text-xs uppercase transition-all hover:text-primary sm:text-sm"
        >
          Xem tất cả sản phẩm
        </NuxtLink>
      </div>

      <MoleculesProductSort class="mb-4 h-fit w-fit max-w-full md:mb-6" />

      <!-- Mobile: thẻ trắng tràn sát 2 mép màn hình như trang chi tiết sản phẩm -->
      <div
        v-if="listProducts.length"
        class="grid grid-cols-2 gap-2 -mx-2.5 sm:(mx-0 gap-5) md:gap-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-8"
      >
        <MoleculesProductCard
          v-for="product in listProducts"
          :key="String(product._id)"
          :product="product"
          flush
          class="overflow-hidden rounded-lg bg-white pb-2.5 sm:rounded-xl"
        >
        </MoleculesProductCard>
      </div>

      <!-- * INFINITE SCROLL: kéo hết danh sách sẽ tự tải thêm sản phẩm -->
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
    <!-- * CONTACT US -->
    <div class="flex flex-col gap-4 lg:max-h-460px lg:flex-row lg:gap-8">
      <div
        class="relative w-full overflow-hidden rounded-2xl text-white md:rounded-3xl contact-banner h-220px sm:h-auto md:min-h-360px lg:min-h-0"
      >
        <img src="/contact-image.webp" alt="contact-us" class="w-full h-full object-cover" />

        <div
          class="absolute bottom-0 left-0 z-10 flex max-w-500px flex-col gap-4 p-(x-5 b-6) sm:p-(x-7 b-8) md:gap-6 md:p-(x-10 b-12)"
        >
          <p class="text-2xl font-semibold sm:text-3xl md:text-4xl">Phong cách & phối đồ</p>
          <p class="text-(sm white/80)">
            Khám phá bí quyết chọn đồ và phối trang phục giúp phái mạnh tự tin, lịch lãm mỗi ngày.
          </p>

          <NuxtLink to="/lien-he" class="text-sm w-fit flex items-center gap-2 font-semibold">
            Liên hệ chúng tôi
            <ArrowRight class="size-4" />
          </NuxtLink>
        </div>
      </div>

      <OrganismsContactForm class="w-full shrink-0 lg:w-384px" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight } from "lucide-vue-next";
import type { TExistedProduct } from "~/types/product.type";

useSeoMeta({
  title: "Doreto | Thời trang nam",
  description:
    "Khám phá thời trang nam Doreto: áo, quần và phụ kiện cùng gợi ý phối đồ giúp phái mạnh tự tin, lịch lãm.",
});

useBreadcrumbSchema([{ name: "Trang chủ", path: "/" }]);

const { $productRepository } = useNuxtApp();
const { productQuery } = storeToRefs(useAppStore());

// Trang chủ luôn hiện toàn bộ sản phẩm (không lọc danh mục, không giữ từ khóa tìm kiếm cũ)
productQuery.value.categoryId = undefined;
productQuery.value.keyword = undefined;
productQuery.value.page = 1;

const { data: homeProducts, status } = await useAsyncData(
  "homeProducts",
  () =>
    $productRepository
      .getMany({ ...productQuery.value, page: 1, limit: 8 })
      .catch(() => ({ data: [], total: 0 })),
  { watch: [productQuery] },
);

// * INFINITE SCROLL
// Danh sách tích lũy: trang 1 lấy từ useAsyncData (có SSR), các trang sau append khi cuộn.
const total = computed(() => homeProducts.value?.total || 0);
const listProducts = ref<TExistedProduct[]>(homeProducts.value?.data || []);
const hasMore = computed(() => listProducts.value.length < total.value);
const currentPage = ref(1);
// Tăng mỗi khi query đổi (đổi tab sắp xếp) để bỏ kết quả load-more cũ đang bay dở.
let fetchVersion = 0;

watch(homeProducts, (res) => {
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
    limit: 8,
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

<style lang="scss" scoped>
.contact-banner {
  &::before {
    content: "";
    position: absolute;
    z-index: 1;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to top, rgba(#d85510, 0.7), rgba(#d85510, 0) 80%);
  }
}
</style>
