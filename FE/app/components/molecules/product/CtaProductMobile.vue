<template>
  <!-- pb max(...) : nâng thanh mua hàng khỏi vạch home của iPhone khi Safari thu gọn thanh công cụ -->
  <div
    class="fixed bottom-0 left-0 right-0 bg-white flex items-center gap-2 p-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] z-[49]"
  >
    <NuxtLink
      to="/san-pham"
      class="bg-white w-12 flex-shrink-0 flex items-center flex-col gap-0.5 justify-center"
    >
      <Store class="size-5" />
      <div class="text-[9px] leading-[9px]">Sản phẩm</div>
    </NuxtLink>
    <a
      href="https://zalo.me/0981128086"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat Zalo"
      class="h-11 w-11 flex-shrink-0 rounded-full overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
    >
      <img
        src="https://phuonglinhdecor.com/wp-content/uploads/2023/04/7044033_zalo_icon.png"
        alt="Zalo"
        class="h-full w-full object-cover"
        width="44"
        height="44"
      />
    </a>
    <AtomsButton
      type="ghost"
      class="!h-11 !p-(y-0 x-4) !bg-primary/10 flex-shrink-0"
      circle
      aria-label="Thêm vào giỏ hàng"
      @click="openDrawer('cart')"
    >
      <svg
        class="size-7 text-primary"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        <path d="M13.5 8.9v5.2" />
        <path d="M10.9 11.5h5.2" />
      </svg>
    </AtomsButton>
    <AtomsButton
      class="w-full !h-11 !rounded-full"
      type="primaryGradient"
      @click="openDrawer('buy-now')"
    >
      <div class="flex flex-col items-center leading-tight">
        <span class="font-semibold text-sm leading-4.5">Mua ngay</span>
        <span class="text-xs font-normal leading-3.5">
          {{ formatPrice(product.minPrice) }}<span class="opacity-70"> | </span>Freeship
        </span>
      </div>
    </AtomsButton>
  </div>

  <ClientOnly>
    <Teleport to="body">
      <div
        v-show="drawerOpen"
        class="fixed inset-0 z-[45] bg-black/40 transition-opacity"
        aria-hidden="true"
        @click="toggleDrawer"
      />

      <MoleculesCommonDrawer
        ref="quickBuyDrawer"
        placement="bottom"
        class="fixed z-50 w-screen h-[calc(100dvh-120px)]"
      >
        <div
          class="h-full flex flex-col rounded-t-2xl bg-white shadow-2xl"
          :style="sheetStyle"
          @touchstart="onSheetTouchStart"
          @touchmove="onSheetTouchMove"
          @touchend="onSheetTouchEnd"
          @touchcancel="onSheetTouchEnd"
        >
          <!-- Thanh kéo + nút đóng -->
          <div data-sheet-handle class="relative flex-shrink-0 pb-2 pt-3">
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
            class="flex-1 overflow-y-auto overscroll-contain p-4 pt-1 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <MoleculesProductPurchaseActions
              :product="product"
              :type="type"
              @buy-now="toggleDrawer"
              @added-to-cart="toggleDrawer"
            />
          </div>
        </div>
      </MoleculesCommonDrawer>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { MoleculesCommonDrawer } from "#components";
import { Store, X } from "lucide-vue-next";
import type { TExistedProduct } from "~/types/product.type";

const props = defineProps<{
  product: TExistedProduct;
}>();

const toast = useToast();

const quickBuyDrawer = ref<InstanceType<typeof MoleculesCommonDrawer> | null>(null);
const drawerOpen = ref(false);

const type = ref<"cart" | "buy-now">("cart");

const openDrawer = (tab: "cart" | "buy-now") => {
  const availableStock = props.product.optionValues.filter((option) => (option.stock ?? 0) > 0);
  if (availableStock.length === 0) {
    toast.error({ message: "Không có sản phẩm nào có số lượng trong kho" });
    return;
  }

  type.value = tab;
  toggleDrawer();
};

const toggleDrawer = () => {
  quickBuyDrawer.value?.toggle({ x: 0, y: "120px" });
  const isOpen = Boolean(unref(quickBuyDrawer.value?.isOpen));
  drawerOpen.value = isOpen;
};

// * VUỐT KÉO XUỐNG ĐỂ ĐÓNG POPUP
// Kéo từ thanh handle thì luôn được; kéo từ phần nội dung chỉ khi nội dung đang ở đầu
// (scrollTop = 0) để không tranh chấp với thao tác cuộn bên trong.
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
  if (isDragging.value && dragOffset.value > SHEET_CLOSE_THRESHOLD && drawerOpen.value) {
    toggleDrawer();
  }
  isDragging.value = false;
  dragOffset.value = 0;
};
</script>
