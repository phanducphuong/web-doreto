<template>
  <div>
    <!-- * REFERENCE -->
    <AtomsButton
      type="ghost"
      class="hover:text-primary h-10 w-10 center-child relative"
      :class="{
        'text-primary !bg-third-light/10': cartDrawer?.isOpen,
      }"
      circle
      @click="toggleDrawer"
    >
      <ShoppingCart class="size-5 shrink-0" />

      <ClientOnly>
        <div
          class="text-(white 10px center) bg-primary rounded-full absolute w-4 h-4 leading-4 -top-0.5 -right-0.5"
        >
          {{ listCartProduct.length }}
        </div>
      </ClientOnly>
    </AtomsButton>

    <!-- * POPOVER -->
    <ClientOnly>
      <!-- Lớp phủ tối che phần trang phía sau khi popup mở; bấm vào để đóng -->
      <Teleport to="body">
        <Transition name="cart-backdrop">
          <div
            v-if="cartDrawer?.isOpen"
            class="fixed inset-0 z-40 bg-black/70"
            @click="toggleDrawer"
          />
        </Transition>
      </Teleport>

      <MoleculesCommonDrawer
        v-show="havenOpen"
        ref="cartDrawer"
        placement="bottom"
        class="w-full fixed z-50"
      >
        <div
          class="flex flex-col rounded-t-2xl bg-bg-cart h-[calc(100dvh-64px)] md:h-[calc(100dvh-72px)] lg:h-[calc(100dvh-80px)]"
          :style="sheetStyle"
          @touchstart="onSheetTouchStart"
          @touchmove="onSheetTouchMove"
          @touchend="onSheetTouchEnd"
          @touchcancel="onSheetTouchEnd"
        >
          <!-- Thanh kéo + nút đóng -->
          <div data-sheet-handle class="relative z-30 flex-shrink-0 pb-2 pt-3">
            <div class="mx-auto h-1 w-10 rounded-full bg-stone-300" />
            <button
              type="button"
              aria-label="Đóng"
              class="absolute right-3 top-2 h-8 w-8 center-child cursor-pointer rounded-full bg-surface-container-highest text-stone-500 transition-colors hover:(bg-stone-200 text-on-surface)"
              @click="toggleDrawer"
            >
              <X class="size-4.5" />
            </button>
          </div>
          <div
            ref="sheetScrollEl"
            class="z-20 mx-auto w-full max-w-1200px flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-1 sm:(px-6 pb-6) lg:pb-8"
          >
          <template v-if="hasCartContent">
            <!-- * TAB CONTENT: popup giỏ hàng và popup mua hàng tách riêng, không còn thanh bước -->
            <div>
              <ShoppingCartTab v-if="currentTab === 'cart' && havenOpen" @next-tab="goToTab(1)" />
              <ShoppingShippingTab
                v-else-if="currentTab === 'shipping' && havenOpen"
                @on-submit-cart-success="handleSubmitCartSuccess"
              />
            </div>
          </template>

          <AtomsUiEmptyCart v-else />
          </div>
        </div>
      </MoleculesCommonDrawer>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, unref } from "vue";
import { ShoppingCart, X } from "lucide-vue-next";
import MoleculesCommonDrawer from "./common/Drawer.vue";
import ShoppingCartTab from "./shopping/CartTab.vue";
import ShoppingShippingTab from "./shopping/ShippingTab.vue";
import type { TExistedPurchaseOrder } from "~/types/purchase-order.type";

const cartDrawer = ref<InstanceType<typeof MoleculesCommonDrawer>>();
const { isLogin } = storeToRefs(useAuthStore());
const { listCartProduct, isCartDrawerOpen, cartDrawerInitialTab, buyNowItem } =
  storeToRefs(usePurchaseOrderStore());
const { initializeCart, setCartDrawerOpen, setCartDrawerInitialTab, setBuyNowItem, setLastBuyNowKey } =
  usePurchaseOrderStore();

// Còn nội dung để thanh toán không (kể cả khi khách bỏ tick hết — vẫn hiện danh sách, không hiện "giỏ trống")
const hasCartContent = computed(() => Boolean(buyNowItem.value) || listCartProduct.value.length > 0);

const havenOpen = ref(false);
const tabs = [
  { index: 1, label: "Giỏ hàng", value: "cart" },
  { index: 2, label: "Giao hàng", value: "shipping" },
];
const currentTabIndex = ref(0);
const currentTab = computed(() => tabs[currentTabIndex.value]!.value);

function goToTab(idx: number) {
  currentTabIndex.value = idx;
}

const resetTabToInitial = () => {
  currentTabIndex.value = 0;
};

const toggleDrawer = () => {
  // Chừa khoảng trống cho header phía trên popup, khớp với chiều cao sheet theo từng breakpoint
  const headerHeight = window.matchMedia("(min-width: 1024px)").matches
    ? 80
    : window.matchMedia("(min-width: 768px)").matches
      ? 72
      : 64;
  cartDrawer.value?.toggle({ x: 0, y: `${headerHeight}px` });
  const isOpen = Boolean(unref(cartDrawer.value?.isOpen));
  setCartDrawerOpen(isOpen);

  if (isOpen) {
    document.body.classList.add("body-overflow");
  } else {
    // User closed checkout without submitting: reset buy-now flow.
    setBuyNowItem(null);
    setLastBuyNowKey(null);
    setCartDrawerInitialTab("cart");
    resetTabToInitial();
    document.body.classList.remove("body-overflow");
  }
};

const openDrawer = () => {
  if (!unref(cartDrawer.value?.isOpen)) {
    toggleDrawer();
  }
};

const closeDrawer = () => {
  if (unref(cartDrawer.value?.isOpen)) {
    toggleDrawer();
  }
};

// * VUỐT KÉO XUỐNG ĐỂ ĐÓNG POPUP
// Kéo từ thanh handle thì luôn được; kéo từ nội dung chỉ khi đang cuộn ở đầu trang
const SHEET_CLOSE_THRESHOLD = 90;
const sheetScrollEl = ref<HTMLElement | null>(null);
const dragOffset = ref(0);
const isDragging = ref(false);
let touchStartY = 0;
let dragFromHandle = false;

const sheetStyle = computed(() => ({
  transform: dragOffset.value ? `translateY(${dragOffset.value}px)` : undefined,
  transition: isDragging.value ? "none" : "transform 0.25s ease",
}));

const onSheetTouchStart = (e: TouchEvent) => {
  touchStartY = e.touches[0]?.clientY ?? 0;
  dragFromHandle = Boolean((e.target as HTMLElement | null)?.closest("[data-sheet-handle]"));
};

const onSheetTouchMove = (e: TouchEvent) => {
  const dy = (e.touches[0]?.clientY ?? 0) - touchStartY;
  const contentAtTop = (sheetScrollEl.value?.scrollTop ?? 0) <= 0;

  if (dy > 0 && (dragFromHandle || contentAtTop)) {
    isDragging.value = true;
    dragOffset.value = dy;
    e.preventDefault();
  } else if (isDragging.value) {
    dragOffset.value = Math.max(0, dy);
  }
};

const onSheetTouchEnd = () => {
  if (isDragging.value && dragOffset.value > SHEET_CLOSE_THRESHOLD && unref(cartDrawer.value?.isOpen)) {
    toggleDrawer();
  }
  isDragging.value = false;
  dragOffset.value = 0;
};

const handleSubmitCartSuccess = (order?: TExistedPurchaseOrder | null) => {
  resetTabToInitial();
  toggleDrawer();

  if (isLogin.value) {
    navigateTo("/profile/order-history");
    return;
  }

  navigateTo({
    path: "/cam-on-dat-hang",
    query: order?._id ? { ma: String(order._id) } : undefined,
  });
};

const applyInitialTab = () => {
  currentTabIndex.value = cartDrawerInitialTab.value === "shipping" ? 1 : 0;
  setCartDrawerInitialTab("cart");
};

if (import.meta.client) {
  initializeCart();
}

watch(
  isCartDrawerOpen,
  (isOpen) => {
    if (!havenOpen.value) {
      havenOpen.value = true;
    }

    if (isOpen) {
      applyInitialTab();
      openDrawer();
      return;
    }
    closeDrawer();
  },
  { flush: "post" },
);

onBeforeUnmount(() => {
  setCartDrawerOpen(false);
  document.body.classList.remove("body-overflow");
});
</script>

<style>
.body-overflow {
  overflow: hidden;
}

.cart-backdrop-enter-active,
.cart-backdrop-leave-active {
  transition: opacity 0.3s ease;
}

.cart-backdrop-enter-from,
.cart-backdrop-leave-to {
  opacity: 0;
}
</style>
