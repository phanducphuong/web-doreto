<template>
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10 xl:gap-12">
    <!--  Cart List -->
    <div class="lg:col-span-7">
      <h2 class="mb-4 text-xl text-on-surface font-semibold sm:(mb-5 text-2xl) lg:mb-6">
        Giỏ hàng
      </h2>
      <div
        v-for="group in displayGroups"
        :key="group.key"
        class="relative mb-4 flex items-start gap-3 rounded-xl bg-white p-3 shadow sm:(mb-5 gap-4 p-4) md:(gap-5 p-5)"
      >
        <button
          type="button"
          :aria-label="isCartGroupSelected(group.lines) ? 'Bỏ chọn sản phẩm' : 'Chọn sản phẩm'"
          class="h-5 w-5 flex-shrink-0 self-center center-child cursor-pointer rounded border transition-colors"
          :class="
            isCartGroupSelected(group.lines)
              ? 'border-primary bg-primary text-white'
              : 'border-stone-300 bg-white text-transparent hover:border-primary/60'
          "
          @click="toggleCartGroupSelected(group.lines)"
        >
          <Check class="size-3.5" />
        </button>
        <AtomsUiImageWithFallback
          :src="group.item.product?.thumbnailUrls?.[0]"
          loading="lazy"
          :is-nuxt-image="false"
          img-class="aspect-square h-20 w-20 object-cover sm:(h-24 w-24) md:(h-30 w-30)"
        />
        <div v-if="group.item.product" class="flex-1">
          <div class="mb-2 flex flex-col items-start gap-1">
            <AtomsBadge
              v-for="tagId in group.item.product.tags"
              :key="tagId._id"
              type="info"
              :label="tagId.name"
            />

            <span class="text-sm font-semibold sm:text-base md:text-lg">{{
              group.item.product.name
            }}</span>
            <span class="text-(10px gray-500) sm:text-xs italic">{{
              getGroupDetailText(group)
            }}</span>
            <AtomsBadge
              v-if="group.isCombo"
              type="success"
              class="mt-0.5 !p-(x-1.5 y-0.5) !text-10px"
              :label="group.item.comboLabel || 'Combo'"
            />
          </div>
          <!-- Combo: số lượng cố định theo gói, không cho +/- -->
          <div
            v-if="group.isCombo"
            class="w-fit rounded-full bg-success-container/30 px-3 py-1 text-xs font-semibold text-success"
          >
            Gồm {{ group.totalQuantity }} sản phẩm
          </div>
          <div
            v-else
            class="center-child w-fit min-w-[90px] gap-2 rounded-full border-(2 primary/10) bg-white p-1.5 leading-none sm:(min-w-[100px] p-2)"
          >
            <button
              class="center-child h-6 w-6 cursor-pointer rounded-full bg-transparent text-lg hover:text-primary sm:text-xl"
              @click="decreaseQty(group.item.product, group.item.optionValue)"
            >
              −
            </button>
            <span class="font-bold text-slate-600">
              {{ group.item.quantity }}
            </span>
            <button
              class="center-child h-6 w-6 text-xl rounded-full bg-transparent hover:text-primary cursor-pointer"
              @click="increaseQty(group.item.product, group.item.optionValue)"
            >
              +
            </button>
          </div>
        </div>
        <div
          class="mt-auto min-w-[84px] text-right text-sm font-bold text-primary sm:(min-w-[100px] text-lg xl:text-xl)"
        >
          {{ formatPrice(group.totalPrice) }}
        </div>
        <AtomsButton
          type="ghost"
          class="absolute right-1 top-1 w-[32px] sm:(right-2 top-2 w-[36px])"
          circle
          :icon="X"
          @click="removeItem(group.item)"
        ></AtomsButton>
      </div>

      <AtomsUiDiscountInput v-model="discountCode" @apply="applyDiscount" />
    </div>

    <!-- Order Summary -->
    <MoleculesShoppingOrderSummary :step="1" class="lg:col-span-5" @next-tab="$emit('nextTab')" />
  </div>

  <!-- Suggest product  -->
  <ClientOnly>
    <div class="mt-10 pb-8 sm:(mt-14 pb-12) lg:(mt-24 pb-16) xl:mt-32">
      <MoleculesShoppingSuggestProduct />
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { usePurchaseOrderStore, groupCartLines } from "~/stores/purchase-order.store";
import { Check, X } from "lucide-vue-next";
import type { TExistedProduct, TOptionValue } from "~/types/product.type";
import type { TCartItem, TCartDisplayGroup } from "~/stores/purchase-order.store";
import { getComboGroupDetailText } from "~/utils/purchase-order.utils";

const emit = defineEmits(["nextTab"]);
const toast = useToast();

const {
  addProductToCart,
  removeProductFromCart,
  removeCartItem,
  getDetailText,
  isCartGroupSelected,
  toggleCartGroupSelected,
} = usePurchaseOrderStore();
const { listCartProduct } = storeToRefs(usePurchaseOrderStore());

// Gộp các dòng combo thành 1 nhóm hiển thị
const displayGroups = computed<TCartDisplayGroup[]>(() => groupCartLines(listCartProduct.value));

// Combo: liệt kê màu/size của mọi sản phẩm trong gói; dòng thường: như cũ
const getGroupDetailText = (group: TCartDisplayGroup) =>
  group.isCombo
    ? getComboGroupDetailText(
        group.item.product,
        group.lines.map((line) => line.optionValue),
      )
    : getDetailText(group.item.product, group.item.optionValue);

const discountCode = ref("");

const increaseQty = (product: TExistedProduct, productOptionValue: TOptionValue) => {
  addProductToCart(product, productOptionValue);
};

const decreaseQty = (product: TExistedProduct, productOptionValue: TOptionValue) => {
  removeProductFromCart(product._id, productOptionValue._id || "", "decrement");
};

const removeItem = (item: TCartItem) => {
  removeCartItem(item);
};

const applyDiscount = () => {
  if (!discountCode.value.trim()) {
    toast.error({ message: "Vui lòng nhập mã giảm giá." });
    return;
  }
  toast.success({ message: "Đã ghi nhận mã giảm giá." });
};
</script>
