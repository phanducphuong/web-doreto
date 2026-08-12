<template>
  <div
    class="h-fit rounded-xl border border-outline-variant/10 bg-white bg-white p-3 sm:p-6 lg:sticky lg:top-32 lg:p-8"
  >
    <h2
      class="mb-2.5 border-b border-outline-variant/10 pb-1.5 text-xl font-headline sm:(mb-6 pb-4 text-2xl) lg:mb-8"
    >
      Thông tin đơn hàng
    </h2>
    <div v-if="props.step === 2" class="mb-2.5 space-y-3 sm:(mb-6 space-y-5) lg:(mb-8 space-y-6)">
      <div
        v-for="item in displayItems"
        :key="getCartItemKey(item)"
        class="flex items-start gap-2 sm:gap-3"
      >
        <!-- Tick chọn mua (chỉ chế độ giỏ hàng) -->
        <button
          v-if="!isBuyNowMode"
          type="button"
          :aria-label="isCartItemSelected(item) ? 'Bỏ chọn sản phẩm' : 'Chọn sản phẩm'"
          class="mt-7 h-5 w-5 flex-shrink-0 center-child cursor-pointer rounded border transition-colors sm:mt-9"
          :class="
            isCartItemSelected(item)
              ? 'border-primary bg-primary text-white'
              : 'border-stone-300 bg-white text-transparent hover:border-primary/60'
          "
          @click="toggleCartItemSelected(item)"
        >
          <Check class="size-3.5" />
        </button>

        <div
          class="flex flex-1 items-start gap-3 transition-opacity sm:gap-4"
          :class="{ 'opacity-50': !isBuyNowMode && !isCartItemSelected(item) }"
        >
          <div
            class="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-surface-container-low sm:(h-24 w-24)"
          >
            <AtomsUiImageWithFallback
              :src="item.optionValue.imageUrl || item.product?.thumbnailUrls?.[0]"
              :is-nuxt-image="false"
              img-class="object-cover w-full h-full"
            />
          </div>
          <div class="min-w-0 flex-1 flex flex-col justify-center">
            <div class="flex items-center gap-1.5">
              <h4 class="line-clamp-2 text-sm font-bold text-on-surface sm:text-base">
                {{ item.product.name }}
              </h4>
            </div>
            <p class="mb-0.5 text-xs text-on-surface-variant sm:(mb-1 text-sm)">
              {{ getDetailText(item.product, item.optionValue) }}
            </p>
            <AtomsBadge
              v-if="item.comboKey"
              type="success"
              class="mb-0.5 w-fit rounded-md !p-(x-1.5 y-0.5) !text-10px"
            >
              {{ item.comboLabel || "Combo" }}
            </AtomsBadge>
            <AtomsBadge
              v-if="!isBuyNowMode && lastBuyNowKey === getCartItemKey(item)"
              type="info"
              class="mb-0.5 w-fit rounded-md !p-(x-1.5 y-0.5) !text-10px"
            >
              Vừa chọn
            </AtomsBadge>
            <div class="flex items-center justify-between gap-2">
              <!-- Dòng combo: số lượng cố định; dòng thường: cộng/trừ -->
              <div
                v-if="item.comboKey"
                class="rounded-full bg-success-container/30 px-2.5 py-1 text-10px font-semibold text-success sm:text-xs"
              >
                Trong combo · 1 sản phẩm
              </div>
              <div
                v-else
                class="flex w-fit items-center gap-1 rounded-full border border-outline-variant/60 bg-white px-1 py-0.5 leading-none"
              >
                <button
                  type="button"
                  aria-label="Giảm số lượng"
                  class="h-5 w-5 center-child cursor-pointer rounded-full bg-transparent text-stone-500 hover:text-primary disabled:(cursor-not-allowed opacity-40 hover:text-stone-500)"
                  :disabled="item.quantity <= 1"
                  @click="decreaseQty(item)"
                >
                  <Minus class="size-3.5" />
                </button>
                <span class="w-6 text-center text-xs font-bold text-slate-600">
                  {{ item.quantity }}
                </span>
                <button
                  type="button"
                  aria-label="Tăng số lượng"
                  class="h-5 w-5 center-child cursor-pointer rounded-full bg-transparent text-stone-500 hover:text-primary disabled:(cursor-not-allowed opacity-40 hover:text-stone-500)"
                  :disabled="item.quantity >= (item.optionValue.stock ?? Infinity)"
                  @click="increaseQty(item)"
                >
                  <Plus class="size-3.5" />
                </button>
              </div>
              <span class="text-sm text-primary font-bold sm:text-base">
                {{ formatPrice(getCartLineUnitPrice(item) * item.quantity) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Xóa khỏi giỏ (chỉ chế độ giỏ hàng) -->
        <button
          v-if="!isBuyNowMode"
          type="button"
          aria-label="Xóa sản phẩm khỏi giỏ"
          class="mt-0.5 h-6 w-6 flex-shrink-0 center-child cursor-pointer rounded-full bg-transparent text-stone-400 transition-colors hover:(bg-stone-100 text-danger)"
          @click="removeItem(item)"
        >
          <X class="size-4" />
        </button>
      </div>

      <p
        v-if="!checkoutItems.length"
        class="rounded-lg bg-surface-container-low p-3 text-center text-xs text-on-surface-variant sm:text-sm"
      >
        Chưa chọn sản phẩm nào. Hãy tick chọn ít nhất 1 sản phẩm để đặt hàng.
      </p>
    </div>
    <div class="mb-1.5 space-y-3 sm:(mb-6 space-y-4) lg:mb-8">
      <div class="flex justify-between text-sm sm:text-base">
        <span class="text-stone-500">Tổng tiền phí vận chuyển</span>
        <span class="font-bold">{{ formatPrice(0) }}</span>
      </div>
    </div>
    <div
      class="mb-3 flex items-center justify-between gap-4 border-(t outline-variant/20) pt-2 sm:(mb-6 gap-8 pt-6) lg:mb-8"
    >
      <span class="text-base font-headline sm:text-lg">Tổng cộng</span>
      <span class="text-2xl text-primary font-body font-bold sm:text-3xl">{{
        formatPrice(summaryPrice)
      }}</span>
    </div>
    <AtomsButton
      type="primaryGradient"
      class="center-child w-full gradient-primary h-unset !p-3 text-sm uppercase disabled:(cursor-not-allowed opacity-50) sm:(!p-4 text-base) lg:(p-6 text-lg)"
      :disabled="!checkoutItems.length"
      @click="handleContinue"
    >
      {{ props.step === 1 ? "Tiếp tục" : "Đặt hàng" }}
    </AtomsButton>
  </div>
</template>

<script lang="ts" setup>
import { Check, Minus, Plus, X } from "lucide-vue-next";
import { getCartLineUnitPrice, type TCartItem } from "~/stores/purchase-order.store";

const emit = defineEmits(["nextTab", "submit"]);

const {
  getDetailText,
  getCartItemKey,
  isCartItemSelected,
  toggleCartItemSelected,
  addProductToCart,
  removeProductFromCart,
  removeCartItem,
  updateBuyNowQuantity,
} = usePurchaseOrderStore();
const { checkoutItems, listCartProduct, buyNowItem, lastBuyNowKey } = storeToRefs(
  usePurchaseOrderStore(),
);

const isBuyNowMode = computed(() => Boolean(buyNowItem.value));

// Danh sách hiển thị: mua ngay → 1 sản phẩm; giỏ hàng → toàn bộ giỏ, sản phẩm "vừa chọn" lên đầu
const displayItems = computed<TCartItem[]>(() => {
  if (buyNowItem.value) return [buyNowItem.value];
  if (!lastBuyNowKey.value) return listCartProduct.value;

  return [...listCartProduct.value].sort(
    (a, b) =>
      Number(getCartItemKey(b) === lastBuyNowKey.value) -
      Number(getCartItemKey(a) === lastBuyNowKey.value),
  );
});

const increaseQty = (item: TCartItem) => {
  if (isBuyNowMode.value) {
    updateBuyNowQuantity(1);
    return;
  }
  addProductToCart(item.product, item.optionValue);
};

const decreaseQty = (item: TCartItem) => {
  if (isBuyNowMode.value) {
    updateBuyNowQuantity(-1);
    return;
  }
  if (item.quantity <= 1) return;
  removeProductFromCart(item.product._id, item.optionValue._id || "", "decrement");
};

const removeItem = (item: TCartItem) => {
  removeCartItem(item);
};

const sumaryProductPrice = computed(() =>
  checkoutItems.value.reduce((acc, item) => {
    acc += item.quantity * getCartLineUnitPrice(item);
    return acc;
  }, 0),
);

const summaryPrice = computed(() => {
  return sumaryProductPrice.value;
});

const handleContinue = () => {
  if (!checkoutItems.value.length) return;

  if (props.step === 1) {
    emit("nextTab");
  } else {
    emit("submit");
  }
};

const props = defineProps<{
  step: number;
}>();
</script>
