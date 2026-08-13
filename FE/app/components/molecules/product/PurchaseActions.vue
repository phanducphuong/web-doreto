<template>
  <!-- * PRICE -->
  <div
    class="flex items-center gap-2 sm:gap-4"
    :class="{ 'max-md:(border-b border-outline-variant pb-4)': !!type }"
  >
    <!--* ẢNH OPTION PRODUCT MOBILE -->
    <div
      v-if="isMobileLayout && !!type"
      class="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-lg"
    >
      <AtomsUiImageWithFallback
        data-alt="ok"
        :src="thumbnailOption"
        :is-nuxt-image="false"
        img-class="w-full h-full object-cover"
      />
    </div>
    <div class="space-y-3 flex flex-col justify-center">
      <!--* PRICE -->
      <div class="flex gap-2 items-baseline">
        <span class="text-2xl text-primary sm:text-3xl font-bold">
          <span>{{ formatPrice(priceData.minPrice) }}</span>
          <span v-if="priceData.minPrice !== priceData.maxPrice"> - </span>
          <span v-if="priceData.minPrice !== priceData.maxPrice">{{
            formatPrice(priceData.maxPrice)
          }}</span>
        </span>
        <span
          v-if="priceData.minPrice === priceData.maxPrice && priceData.originalPrice"
          class="text-sm text-stone-300 line-through md:text-lg"
        >
          {{ formatPrice(priceData.originalPrice) }}
        </span>
      </div>
      <!--* STOCK + QUANTITY MOBILE -->
      <div v-if="!hasCombo && isMobileLayout && !!type" class="flex items-center gap-2">
        <div class="w-fit flex items-center rounded-lg bg-surface-container-highest p-1">
          <button
            class="h-5 w-5 center-child cursor-pointer bg-transparent text-stone-400 hover:text-on-surface disabled:(cursor-not-allowed opacity-50 hover:text-stone-400)"
            :disabled="selectedQuantity <= 1 || !isFullySelected"
            @click="selectedQuantity = Math.max(1, selectedQuantity - 1)"
          >
            <Minus class="size-4" />
          </button>
          <span class="w-8 text-center text-xs font-bold mx-1 leading-4 border-(x stone-300)">{{
            selectedQuantity
          }}</span>
          <button
            class="h-5 w-5 center-child cursor-pointer bg-transparent text-stone-400 hover:text-on-surface disabled:(cursor-not-allowed opacity-50 hover:text-stone-400)"
            :disabled="selectedQuantity >= maxSelectableQuantity || !isFullySelected"
            @click="selectedQuantity = Math.min(maxSelectableQuantity, selectedQuantity + 1)"
          >
            <Plus class="size-4" />
          </button>
        </div>
        <div class="text-xs text-stone-500" :class="{ '!text-danger': priceData.stockCount <= 0 }">
          Kho: {{ priceData.stockCount }}
        </div>
        <AtomsBadge
          v-if="priceData.maxDiscountPercent"
          type="error"
          class="-mb-0.5 mx-1 rounded-md !p-(x-1 y-0.5) !text-xs"
        >
          -{{ priceData.maxDiscountPercent }}%
        </AtomsBadge>
      </div>
    </div>
  </div>

  <div
    v-if="!isMobileLayout || (isMobileLayout && !!type)"
    class="space-y-5 rounded-xl p-3 -mx-3 lg:(bg-surface-container-low p-4 space-y-4 mx-0)"
    :class="{ 'ring-1 ring-danger': validateMsg }"
  >
    <!-- * COMBO (mua theo gói: chọn combo → màu → size) -->
    <MoleculesProductComboPurchase
      v-if="hasCombo"
      :product="product"
      @added-to-cart="emit('added-to-cart')"
      @buy-now="emit('buy-now')"
    />

    <!-- * CHỌN OPTION PRODUCT -->
    <AtomsSelectOptionProduct
      v-if="!hasCombo && product.optionValues?.length && product.productOptions?.length > 0"
      id="product-option-picker"
      :product="product"
      class="max-md:(border-b border-outline-variant pb-4) scroll-mt-24"
      @select-product="handleSelectProduct"
    />

    <!-- * QUANTITY -->
    <div v-if="!hasCombo && !isMobileLayout" class="flex flex-wrap items-center justify-between gap-3">
      <AtomsBadge :type="priceData.stockCount > 0 ? 'success' : 'error'">
        <div
          class="mr-2 h-2 w-2 rounded-full"
          :class="priceData.stockCount > 0 ? 'bg-green-500' : 'bg-red-500'"
        />
        Còn {{ priceData.stockCount }} sản phẩm
      </AtomsBadge>
      <div class="w-fit flex items-center rounded-full bg-surface-container-highest px-2 py-1">
        <button
          class="h-8 w-8 center-child cursor-pointer bg-transparent text-stone-400 hover:text-on-surface disabled:(cursor-not-allowed opacity-50 hover:text-stone-400)"
          :disabled="selectedQuantity <= 1 || !isFullySelected"
          @click="selectedQuantity = Math.max(1, selectedQuantity - 1)"
        >
          <Minus class="size-4" />
        </button>
        <span class="w-10 text-center text-sm font-bold">{{ selectedQuantity }}</span>
        <button
          class="h-8 w-8 center-child cursor-pointer bg-transparent text-stone-400 hover:text-on-surface disabled:(cursor-not-allowed opacity-50 hover:text-stone-400)"
          :disabled="selectedQuantity >= maxSelectableQuantity || !isFullySelected"
          @click="selectedQuantity = Math.min(maxSelectableQuantity, selectedQuantity + 1)"
        >
          <Plus class="size-4" />
        </button>
      </div>
    </div>

    <!-- * CTA -->
    <div v-if="!hasCombo" class="grid grid-cols-1 gap-3 pt-2 font-bold sm:(grid-cols-2 gap-4 pt-4)">
      <AtomsButton
        v-if="type !== 'buy-now'"
        type="secondary"
        class="h-unset !py-4 sm:!py-5 lg:!py-3.5 disabled:(opacity-50 cursor-not-allowed)"
        :disabled="!priceData.stockCount"
        @click="handleAddToCart"
      >
        <ShoppingBag class="size-5 sm:size-6" />
        Thêm vào giỏ
      </AtomsButton>
      <AtomsButton
        v-if="type !== 'cart'"
        type="primaryGradient"
        class="h-unset !py-4 sm:!py-5 lg:!py-3.5 disabled:(opacity-50 cursor-not-allowed)"
        :disabled="!priceData.stockCount"
        @click="handleBuyNow"
      >
        Mua ngay
      </AtomsButton>
    </div>

    <div v-if="validateMsg" class="text-danger text-sm">{{ validateMsg }}</div>
  </div>

  <Transition
    v-if="!isMobileLayout"
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-4"
  >
    <div
      v-if="isScrollCtaVisible"
      class="fixed bottom-6 left-1/2 z-[10] -translate-x-1/2 sm:bottom-8"
    >
      <AtomsButton
        type="primaryGradient"
        class="animate-pulse-alt text-base !p-(x-5 y-3) sm:(text-xl !p-(x-8 y-6))"
        @click="scrollToTop"
      >
        Mua ngay
      </AtomsButton>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { Minus, Plus, ShoppingBag } from "lucide-vue-next";
import type { TExistedProduct, TOptionValue } from "~/types/product.type";
import { PRODUCT_OPTION_SELECTION_KEY } from "~/composables/useProductOptionSelection";
import { getProductPriceData } from "~/utils/data.utils";

const props = defineProps<{
  product: TExistedProduct;
  type?: "cart" | "buy-now";
}>();

const emit = defineEmits<{
  (e: "added-to-cart"): void;
  (e: "buy-now"): void;
}>();

const {
  addProductToCart,
  setBuyNowItem,
  setLastBuyNowKey,
  getCartItemKey,
  setCartDrawerInitialTab,
  setCartDrawerOpen,
} = usePurchaseOrderStore();
const { listCartProduct } = storeToRefs(usePurchaseOrderStore());
const toast = useToast();
const { isLg } = useDeviceBreakpoint();

const isMobileLayout = computed(() => !isLg.value);
const hasCombo = computed(() => (props.product.comboTiers?.length ?? 0) > 0);
const injectedSelection = inject(PRODUCT_OPTION_SELECTION_KEY, null);

const existedOptionValues = ref<TOptionValue[]>(
  props.product.optionValues?.filter((option) => option.stock) || [],
);
const isFullySelected = ref(
  injectedSelection?.isFullySelected.value ?? (props.product.optionValues?.length ?? 0) === 1,
);

if (injectedSelection) {
  watch(
    () => injectedSelection.matchedOptions.value,
    (options) => {
      existedOptionValues.value = options;
      isFullySelected.value = injectedSelection.isFullySelected.value;
    },
    { immediate: true },
  );
}
const selectedQuantity = ref(1);
const isScrollCtaVisible = ref(false);
const ctaScrollThreshold = 500;

const thumbnailOption = computed(() =>
  isFullySelected.value && existedOptionValues.value[0]?.imageUrl
    ? existedOptionValues.value[0]?.imageUrl
    : props.product.thumbnailUrls?.[0],
);

const maxSelectableQuantity = computed(() => existedOptionValues.value[0]?.stock ?? 0);

const priceData = computed(() => getProductPriceData(props.product, existedOptionValues.value));

const handleSelectProduct = (res: { optionList: TOptionValue[]; isFullySelected: boolean }) => {
  validateMsg.value = "";

  existedOptionValues.value = res.optionList;
  isFullySelected.value = res.isFullySelected;
  selectedQuantity.value = 1;
};

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

const handleWindowScroll = () => {
  isScrollCtaVisible.value = window.scrollY >= ctaScrollThreshold;
};

onMounted(() => {
  if (isMobileLayout.value) {
    handleWindowScroll();
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
  }
});

onBeforeUnmount(() => {
  if (isMobileLayout.value) {
    window.removeEventListener("scroll", handleWindowScroll);
  }
});

const validateMsg = ref("");

const getSelectedOption = () => {
  if (!isFullySelected.value) {
    validateMsg.value = "Vui lòng chọn phân loại sản phẩm hợp lệ.";
    return null;
  }

  const option = existedOptionValues.value[0];
  if (!option) {
    validateMsg.value = "Vui lòng chọn phân loại sản phẩm hợp lệ.";
    toast.error({ message: "Vui lòng chọn phân loại sản phẩm hợp lệ." });
    return null;
  }

  return option;
};

const handleAddToCart = async () => {
  const option = getSelectedOption();
  if (!option) {
    return false;
  }

  const res = await addProductToCart(props.product, option, selectedQuantity.value);
  if (res) {
    toast.success({ message: "Thêm vào giỏ hàng thành công" });
    emit("added-to-cart");
    return true;
  } else {
    toast.error({ message: "Thêm vào giỏ hàng thất bại" });
    return false;
  }
};

const handleBuyNow = async () => {
  const option = getSelectedOption();
  if (!option) {
    return;
  }

  if (listCartProduct.value.length > 0) {
    // Giỏ đang có hàng: gộp sản phẩm mua ngay vào giỏ, đặt chung một đơn.
    // Sản phẩm này được đánh dấu để hiện nhãn "Vừa chọn" và nằm đầu danh sách.
    await addProductToCart(props.product, option, selectedQuantity.value);
    setBuyNowItem(null);
    setLastBuyNowKey(getCartItemKey({ product: props.product, optionValue: option }));
  } else {
    // Giỏ trống: mua nhanh đúng 1 sản phẩm, không đụng vào giỏ.
    setBuyNowItem({
      product: props.product,
      optionValue: option,
      quantity: selectedQuantity.value,
    });
    setLastBuyNowKey(null);
  }

  setCartDrawerInitialTab("shipping");
  setCartDrawerOpen(true);
  emit("buy-now");
};
</script>
