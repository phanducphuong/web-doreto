<template>
  <div
    v-if="product"
    class="min-w-0 -mx-4 -mt-4 pb-2.5 space-y-2.5 md:(-mx-8 -mt-8 pb-4 space-y-3) lg:(mx-0 mt-0 py-6 space-y-5)"
  >
    <!-- * IMAGE GALLERY (ASYMMETRIC LAYOUT) -->
    <div
      id="product-scroll-overview"
      class="!mt-0 grid grid-cols-1 gap-4 bg-white pb-3 md:gap-8 lg:(grid-cols-12 gap-12 p-6 rounded-xl)"
    >
      <div class="flex flex-col gap-2.5 md:gap-6 lg:col-span-7">
        <div
          ref="mobileGalleryRef"
          class="relative aspect-[4/5] bg-surface-container-low rounded-none w-full group overflow-hidden shadow-sm lg:rounded-xl"
          :class="{
            'select-none touch-pan-y': isMobileLayout && totalImages > 1,
            'cursor-zoom-in': totalImages > 0,
          }"
          @click="handleGalleryClick"
        >
          <!-- Ảnh đầu tải ngay (eager), các ảnh sau tải nền lần lượt sau khi trang hiện -->
          <div v-if="isMobileLayout" class="h-full w-full flex" :style="mobileImageTrackStyle">
            <div
              v-for="(image, index) in listImages"
              :key="image"
              class="h-full w-full shrink-0 grow-0 basis-full"
            >
              <AtomsUiImageWithFallback
                :src="image"
                alt="chi tiết sản phẩm"
                :width="689"
                :height="861"
                format="webp"
                :loading="index === 0 ? 'eager' : 'lazy'"
                img-class="object-cover w-full h-full"
              />
            </div>
          </div>
          <AtomsUiImageWithFallback
            v-else
            :src="selectedImage"
            alt="chi tiết sản phẩm"
            :width="689"
            :height="861"
            format="webp"
            loading="eager"
            img-class="object-cover w-full h-full"
          />

          <div
            v-if="product?.tags?.length"
            class="absolute left-3 top-3 flex flex-col gap-1.5 sm:(left-6 top-6 gap-2)"
          >
            <AtomsBadge
              v-for="tag in product.tags"
              :key="tag._id"
              type="info"
              :label="tag.name"
              class="!text-xs !font-bold !p-(x-3 y-0.5) sm:(!text-sm !p-(x-4 y-0.75)) lg:(!text-lg !p-(x-5 y-1))"
            />
          </div>

          <!-- * Mũi tên nhấp nháy gợi ý vuốt/bấm để xem ảnh kế tiếp -->
          <template v-if="isMobileLayout && totalImages > 1">
            <button
              class="gallery-swipe-hint absolute left-2 top-1/2 z-2 size-8 center-child rounded-full border-none bg-black/40 text-white -translate-y-1/2"
              aria-label="Xem ảnh trước"
              @click.stop="goToImageByOffset(-1)"
              @touchstart.stop
              @touchend.stop
            >
              <ChevronLeft class="gallery-hint-icon-left size-5" />
            </button>
            <button
              class="gallery-swipe-hint absolute right-2 top-1/2 z-2 size-8 center-child rounded-full border-none bg-black/40 text-white -translate-y-1/2"
              aria-label="Xem ảnh kế tiếp"
              @click.stop="goToImageByOffset(1)"
              @touchstart.stop
              @touchend.stop
            >
              <ChevronRight class="gallery-hint-icon-right size-5" />
            </button>
          </template>

          <div
            v-if="isMobileLayout && totalImages > 1"
            class="absolute bottom-3 right-3 rounded-full bg-black/55 px-3.5 py-1.5 text-sm font-semibold text-white"
          >
            {{ currentImageIndex + 1 }}/{{ totalImages }}
          </div>
        </div>

        <MoleculesProductGalleryVariantStrip
          v-if="showVariantStrip"
          :items="galleryStripItems"
          :selected-image="selectedImage"
          :active-option-value-id="activeOptionValueId"
          :gallery-preview-image="selectedImage || listImages[0] || ''"
          :get-strip-labels="getStripLabels"
          @select="onStripSelectItem"
          @open-gallery="openGalleryLightbox()"
        />

        <!-- * PC: thumbnail slider khi không có phân loại -->
        <template v-else-if="!isMobileLayout && listImages.length > 1">
          <MoleculesCommonSlider
            v-if="listImages.length >= 4"
            class="gap-2 sm:gap-3 md:gap-4"
            :items="listImages"
            :slides-per-view="4"
            :show-nav="true"
            :gap="16"
            :show-dots="false"
          >
            <template #item="{ item }">
              <div
                class="aspect-square overflow-hidden rounded-lg w-full cursor-zoom-in border-2 border-transparent"
                :class="{
                  '!border-primary': selectedImage === item,
                }"
                @click="onThumbnailClick(item)"
              >
                <AtomsUiImageWithFallback
                  :src="item"
                  alt="chi tiết sản phẩm"
                  :width="161"
                  :height="161"
                  format="webp"
                  loading="lazy"
                  img-class="object-cover max-w-full max-h-full aspect-square"
                />
              </div>
            </template>
          </MoleculesCommonSlider>

          <div v-else class="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            <div
              v-for="item in listImages"
              :key="item"
              class="aspect-square overflow-hidden rounded-lg w-full cursor-zoom-in"
              :class="{
                'border-2 border-primary': selectedImage === item,
              }"
              @click="onThumbnailClick(item)"
            >
              <AtomsUiImageWithFallback
                :src="item"
                alt="chi tiết sản phẩm"
                :width="161"
                :height="161"
                img-class="object-cover max-w-full max-h-full aspect-square"
              />
            </div>
          </div>
        </template>
      </div>

      <div class="flex flex-col gap-2 px-3 md:gap-6 lg:(col-span-5 gap-8 px-0)">
        <header :class="{ 'order-1': isMobileLayout }">
          <!-- <AtomsBreadCrumb :breadcrumbs="breadcrumbs" class="mb-2 md:mb-4" /> -->
          <h1
            class="mb-3 text-xl text-on-surface font-semibold leading-tight mt-2 md:(mt-0 mb-4 text-4xl) lg:text-5xl"
          >
            {{ product.name }}
          </h1>
          <!-- * RATING + COUNT + STOCK -->
          <div class="flex flex-wrap items-center gap-2 text-xs sm:gap-3 sm:text-sm md:gap-4">
            <AtomsUiRating
              :rating="product.averageRating"
              :truncate="isMobileLayout"
              class="-mt-0.5"
            />
            <span class="text-tertiary"> ({{ product.ratingCount }}) </span>
            <span class="text-tertiary-container/20">|</span>
            <span> Đã bán {{ getDisplayPurchaseCount(product) }}</span>
          </div>
        </header>

        <MoleculesProductPurchaseActions :product="product" />
        <AtomsUiBenefit class="order-3 mt-1 pt-3 border-t border-stone-200 w-full" />
        <AtomsUiTrustBadges class="order-4 mt-1 py-3 border-t border-b border-stone-200 w-full" />
      </div>
    </div>

    <!-- * FEEDBACK SECTION -->
    <div
      id="product-scroll-reviews"
      class="scroll-mt-[7rem] bg-white px-2 py-3 lg:(scroll-mt-0 p-6 rounded-xl)"
    >
      <ProductFeedbackSection :product-id="product._id" />
    </div>

    <!-- * RELATED PRODUCTS -->
    <div
      v-if="relatedProducts.length"
      id="product-scroll-related"
      class="scroll-mt-[7rem] bg-surface-container px-1.5 py-3 lg:(scroll-mt-0 p-6 rounded-xl)"
    >
      <MoleculesShoppingRelateProducts :related-products="relatedProducts" />
    </div>

    <!-- * THÔNG TIN SHOP + ĐÁNH GIÁ CỬA HÀNG (trên phần mô tả) -->
    <OrganismsShopOverview class="px-1.5 lg:px-0" />

    <!-- * PRODUCT DESC -->
    <div
      v-if="product.description"
      id="product-scroll-description"
      class="scroll-mt-[7rem] bg-white px-2 py-3 lg:(scroll-mt-0 p-6 rounded-xl)"
    >
      <MoleculesProductDescription
        :description="product.description"
        :description-frame="product.descriptionFrame"
      />
    </div>

    <!-- * SUGGEST PRODUCTS (infinite scroll, getMany — loại trừ SP hiện tại ở FE) -->
    <section
      v-if="loadingSuggestProducts || suggestProducts.length"
      id="product-scroll-suggest"
      class="scroll-mt-[7rem] bg-surface-container px-1.5 py-3 lg:(scroll-mt-0 p-6 rounded-xl)"
    >
      <div class="mb-3 px-1.5 sm:mb-6 lg:(mb-8 px-0)">
        <h2 class="text-lg font-semibold text-on-surface sm:text-3xl">Có thể bạn quan tâm</h2>
        <p
          v-if="loadingSuggestProducts && !suggestProducts.length"
          class="mt-1 text-xs text-on-surface-variant sm:text-sm"
        >
          Đang tải gợi ý...
        </p>
      </div>
      <div class="grid grid-cols-2 gap-1.5 sm:gap-5 lg:grid-cols-4 lg:gap-6">
        <MoleculesProductCard
          v-for="item in suggestProducts"
          :key="item._id"
          :product="item"
          flush
          class="overflow-hidden rounded-lg bg-white pb-2.5 lg:rounded-xl"
        />
      </div>
    </section>

    <MoleculesScrollTrigger
      v-if="product && hasMoreSuggestProducts"
      ref="suggestScrollTriggerRef"
      class="mt-2"
      :pivot-trigger-margin="320"
      @scrollend="onSuggestProductsScrollEnd"
    />

    <!-- * CTA PRODUCT MOBILE -->
    <MoleculesProductCtaProductMobile v-if="isMobileLayout" :product="product" />
  </div>
</template>
<script setup lang="ts">
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import type { TBreadcrumb } from "~/types/base.type";
import type { TExistedProduct, TOptionValue } from "~/types/product.type";
import ProductFeedbackSection from "~/components/Organisms/ProductFeedbackSection.vue";
import {
  PRODUCT_OPTION_SELECTION_KEY,
  useProductOptionSelection,
} from "~/composables/useProductOptionSelection";
import { getDisplayPurchaseCount } from "~/utils/product.utils";

const route = useRoute();
const router = useRouter();

// Nền xám kiểu TikTok Shop, chỉ áp dụng khi đang ở trang này
useHead({ bodyAttrs: { class: "!bg-stone-200" } });
const { $productRepository } = useNuxtApp();
const { emitOpenImageLightbox } = useImageLightbox();
const isMobileLayout = computed(() => !isLg.value);

// const tabs = [
//   { label: "Chi tiết sản phẩm", value: "chi-tiet-san-pham" },
//   { label: "Đánh giá", value: "danh-gia" },
// ];
// const { currentTab, setCurrentTab } = useTab("chi-tiet-san-pham");

const { id } = route.params;

const { isLg } = useDeviceBreakpoint();

// * FETCH PRODUCT
const { data: product } = await useAsyncData(
  `${route.params.slug}-I${route.params.id}`,
  async () => {
    const product = await $productRepository.getOne(Number(id));
    return product;
  },
);

const { data: relatedProductsData } = await useAsyncData(`related-products-${id}`, () =>
  $productRepository.getRelatedProducts(Number(id)),
);
const relatedProducts = computed(() => relatedProductsData.value ?? []);

// * STATES
const selectedImage = ref<string>();
const optionSelection = useProductOptionSelection(product);
provide(PRODUCT_OPTION_SELECTION_KEY, optionSelection);

const { activeOptionValueId, getStripLabels, selectOptionValue, selectedOption } = optionSelection;

// * COMPUTED
const breadcrumbs = computed(() => {
  const temp: TBreadcrumb[] = [
    { label: "Trang chủ", to: "/" },
    {
      label: product.value?.name || "",
    },
  ];

  if (product.value?.categories?.length === 1 && product.value?.categories[0]?.slug) {
    const category = product.value?.categories[0];
    temp.splice(1, 0, {
      label: category.name || "",
      to: {
        name: "danh-muc",
        params: { slug: category.slug, id: category._id },
      },
    });
  }

  return temp;
});

const productMetaDescription = computed(() => {
  const raw = (product.value?.description || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return raw || "Chi tiết sản phẩm thời trang tại Doreto.";
});

useSeoMeta({
  title: () => `${product.value?.name || "Chi tiết sản phẩm"} | Doreto`,
  description: () => productMetaDescription.value,
  ogImage: () => product.value?.thumbnailUrls?.[0] || "/banner.webp",
});

useBreadcrumbSchema(
  computed(() =>
    breadcrumbs.value.map((breadcrumb, index) => ({
      name: breadcrumb.label,
      path:
        index === breadcrumbs.value.length - 1
          ? route.path
          : breadcrumb.to
            ? router.resolve(breadcrumb.to).href
            : route.path,
    })),
  ),
);

const listImages = computed(() => {
  const productImages = product.value?.imageUrls || [];
  const optionsImages =
    product.value?.optionValues?.flatMap((option) => option.imageUrl || []) || [];
  return [...new Set([...productImages, ...optionsImages])];
});

// * TẢI NỀN LẦN LƯỢT CÁC ẢNH GALLERY CÒN LẠI
// Ảnh đầu tải ngay khi vào trang; các ảnh sau tải tuần tự (từng ảnh một) sau khi
// trang đã hiển thị, để không tranh băng thông với ảnh đầu và nội dung chính.
const $imgBuilder = useImage();
let galleryPreloadStarted = false;

const preloadRemainingGalleryImages = () => {
  if (!import.meta.client || galleryPreloadStarted) return;
  galleryPreloadStarted = true;

  const urls = listImages.value
    .slice(1)
    .map((src) => $imgBuilder(src, { width: 689, height: 861, format: "webp" }));

  let index = 0;
  const loadNext = () => {
    if (index >= urls.length) return;
    const img = new Image();
    img.onload = loadNext2;
    img.onerror = loadNext2;
    img.src = urls[index]!;
    function loadNext2() {
      index += 1;
      loadNext();
    }
  };
  loadNext();
};

onMounted(() => {
  // Chờ 1 nhịp cho ảnh đầu + nội dung chính tải xong rồi mới tải nền ảnh còn lại
  setTimeout(preloadRemainingGalleryImages, 1200);
});

const galleryStripItems = computed(() => {
  const optionByImage = new Map<string, TOptionValue>();

  for (const option of product.value?.optionValues ?? []) {
    if (!option.imageUrl) continue;
    const existing = optionByImage.get(option.imageUrl);
    if (!existing || ((option.stock ?? 0) > 0 && (existing.stock ?? 0) <= 0)) {
      optionByImage.set(option.imageUrl, option);
    }
  }

  const items = listImages.value.map((imageUrl) => ({
    id: imageUrl,
    imageUrl,
    option: optionByImage.get(imageUrl),
  }));

  return [...items.filter((item) => item.option), ...items.filter((item) => !item.option)];
});

const showVariantStrip = computed(() => galleryStripItems.value.length > 1);

const currentImageIndex = computed(() => {
  const index = listImages.value.findIndex((item) => item === selectedImage.value);
  return index >= 0 ? index : 0;
});

const goToImageByOffset = (offset: number) => {
  const images = listImages.value;
  if (!images.length) return;

  const nextIndex = (currentImageIndex.value + offset + images.length) % images.length;
  const nextImage = images[nextIndex];
  if (nextImage) {
    selectedImage.value = nextImage;
    syncOptionFromImage(nextImage);
  }
};

const totalImages = computed(() => listImages.value.length);

const openGalleryLightbox = (index = currentImageIndex.value) => {
  if (!listImages.value.length) return;
  emitOpenImageLightbox({ images: listImages.value, index });
};

const onThumbnailClick = (item: string) => {
  selectedImage.value = item;
  syncOptionFromImage(item);
  const index = listImages.value.findIndex((image) => image === item);
  openGalleryLightbox(index >= 0 ? index : 0);
};

const syncOptionFromImage = (imageUrl?: string) => {
  if (!imageUrl) return;
  const matched = galleryStripItems.value.find((item) => item.imageUrl === imageUrl)?.option;
  if (matched && (matched.stock ?? 0) > 0) {
    selectOptionValue(matched);
  }
};

const onStripSelectItem = (item: { imageUrl: string; option?: TOptionValue }) => {
  selectedImage.value = item.imageUrl;
  if (item.option && (item.option.stock ?? 0) > 0) {
    selectOptionValue(item.option);
  }
};

const handleGalleryClick = () => {
  if (!isMobileLayout.value || totalImages.value === 1) {
    openGalleryLightbox();
  }
};

const {
  rootRef: mobileGalleryRef,
  deltaX: touchDeltaX,
  isDragging: isTouchDragging,
} = useTouchAxisCarousel({
  enabled: computed(() => isMobileLayout.value && totalImages.value > 1),
  onSwipe: (direction) => goToImageByOffset(direction),
  onTap: () => openGalleryLightbox(),
});

const mobileImageTrackStyle = computed(() => {
  const translatePercent = -(currentImageIndex.value * 100);
  const translatePx = touchDeltaX.value;
  return {
    transform: `translate3d(calc(${translatePercent}% + ${translatePx}px), 0, 0)`,
    transition: isTouchDragging.value ? "none" : "transform 280ms ease",
  };
});

// * SUGGEST PRODUCTS (getMany + infinite scroll)
const SUGGEST_PAGE_SIZE = 8;

const suggestProducts = ref<TExistedProduct[]>([]);
const suggestPage = ref(0);
const suggestTotal = ref(0);
const loadingSuggestProducts = ref(false);
const suggestScrollTriggerRef = ref<{ loadObserver: () => void } | null>(null);

const hasMoreSuggestProducts = computed(() => {
  if (!product.value || suggestTotal.value <= 0) return false;
  const totalPages = Math.ceil(suggestTotal.value / SUGGEST_PAGE_SIZE);
  return suggestPage.value < totalPages;
});

const mergeSuggestPage = (page: number, incoming: TExistedProduct[]) => {
  const currentId = product.value!._id;
  const deduped = incoming.filter((p) => p._id !== currentId);
  if (page === 1) {
    suggestProducts.value = deduped;
    return;
  }
  const seen = new Set(suggestProducts.value.map((p) => p._id));
  for (const p of deduped) {
    if (!seen.has(p._id)) {
      seen.add(p._id);
      suggestProducts.value.push(p);
    }
  }
};

const fetchSuggestProductsPage = async (page: number) => {
  if (!product.value) return;

  const res = await $productRepository.getMany({
    page,
    limit: SUGGEST_PAGE_SIZE,
    sortBy: "purchaseCount",
    sortOrder: "desc",
  });

  suggestTotal.value = res.total;
  mergeSuggestPage(page, res.data);
  suggestPage.value = page;
};

const loadSuggestProductsInitial = async () => {
  if (!product.value) return;
  loadingSuggestProducts.value = true;
  try {
    suggestPage.value = 0;
    suggestTotal.value = 0;
    await fetchSuggestProductsPage(1);
  } finally {
    loadingSuggestProducts.value = false;
  }
  await nextTick();
  if (hasMoreSuggestProducts.value) {
    suggestScrollTriggerRef.value?.loadObserver();
  }
};

const onSuggestProductsScrollEnd = async () => {
  if (!product.value || loadingSuggestProducts.value || !hasMoreSuggestProducts.value) return;

  loadingSuggestProducts.value = true;
  try {
    await fetchSuggestProductsPage(suggestPage.value + 1);
  } finally {
    loadingSuggestProducts.value = false;
  }

  await nextTick();
  if (hasMoreSuggestProducts.value) {
    suggestScrollTriggerRef.value?.loadObserver();
  }
};

watch(
  () => product.value?._id,
  () => {
    if (!product.value) return;
    suggestProducts.value = [];
    suggestPage.value = 0;
    suggestTotal.value = 0;
    void loadSuggestProductsInitial();
  },
  { immediate: true },
);

// * INIT

if (listImages.value.length > 0) {
  selectedImage.value = listImages.value[0];
}

watch(
  listImages,
  (images) => {
    if (!images.length) {
      selectedImage.value = undefined;
      return;
    }

    if (!selectedImage.value || !images.includes(selectedImage.value)) {
      selectedImage.value = images[0];
    }
  },
  { immediate: true },
);

watch(selectedOption, (option) => {
  if (!option?.imageUrl) return;
  if (listImages.value.includes(option.imageUrl)) {
    selectedImage.value = option.imageUrl;
  }
});
</script>
<style scoped>
/* Nhấp nháy + đẩy nhẹ mũi tên sang hai bên để gợi ý vuốt xem ảnh kế tiếp */
.gallery-swipe-hint {
  animation: gallery-hint-blink 1.6s ease-in-out infinite;
}

.gallery-hint-icon-left {
  animation: gallery-hint-nudge-left 1.6s ease-in-out infinite;
}

.gallery-hint-icon-right {
  animation: gallery-hint-nudge-right 1.6s ease-in-out infinite;
}

@keyframes gallery-hint-blink {
  0%,
  100% {
    opacity: 0.45;
  }
  50% {
    opacity: 1;
  }
}

@keyframes gallery-hint-nudge-left {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(-3px);
  }
}

@keyframes gallery-hint-nudge-right {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(3px);
  }
}
</style>
