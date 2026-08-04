<template>
  <div class="fixed inset-0 z-50">
    <!-- Lớp phủ tối, bấm vào để đóng -->
    <div class="animate-backdrop-in absolute inset-0 bg-black/70" @click="closePage" />

    <!-- Bottom sheet: trượt từ dưới lên, giống popup mua hàng -->
    <div
      class="animate-sheet-up absolute inset-x-0 bottom-0 flex flex-col rounded-t-2xl bg-bg-cart h-[calc(100dvh-64px)] md:h-[calc(100dvh-72px)] lg:h-[calc(100dvh-80px)]"
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
          @click="closePage"
        >
          <X class="size-4.5" />
        </button>
      </div>

      <div
        ref="sheetScrollEl"
        class="flex-1 overflow-y-auto overscroll-contain px-4 pb-3 pt-1 sm:px-6"
      >
        <section class="mx-auto w-full max-w-720px">
          <div
            class="overflow-hidden rounded-3xl border border-outline-variant/60 bg-surface shadow-[0_24px_48px_rgba(216,85,16,0.08)]"
          >
            <div class="gradient-primary px-4 py-3 text-center text-white md:(px-10 py-7)">
              <div class="flex items-center justify-center gap-2 md:gap-3">
                <div
                  class="center-child h-8 w-8 shrink-0 rounded-full bg-white md:(h-11 w-11)"
                >
                  <CheckCircle2 class="size-5 text-emerald-500 md:size-6.5" />
                </div>
                <h1 class="font-noto text-xl font-semibold whitespace-nowrap md:text-3xl">
                  Cảm ơn bạn đã đặt hàng!
                </h1>
              </div>
              <p class="mt-1 text-sm leading-snug text-white/90 md:(mt-2 text-base leading-normal)">
                Đơn hàng của bạn đã được ghi nhận. Nhân viên Doreto sẽ liên hệ xác nhận
                trong thời gian sớm nhất.
              </p>
            </div>

            <div class="space-y-2 p-3 md:(space-y-5 p-7)">
              <div class="space-y-2.5 md:space-y-3">
                <h2 class="text-lg font-semibold text-on-surface">Quy trình xử lý đơn hàng</h2>
                <ol class="space-y-1.5 md:space-y-2.5">
                  <li
                    v-for="(step, index) in nextSteps"
                    :key="step.title"
                    class="flex items-center gap-3 rounded-2xl bg-surface-container-low p-2.5 md:p-4"
                  >
                    <span
                      class="center-child h-7 w-7 shrink-0 rounded-full bg-primary text-xs font-bold text-white"
                    >
                      {{ index + 1 }}
                    </span>
                    <p class="font-semibold text-on-surface">{{ step.title }}</p>
                  </li>
                </ol>
              </div>

              <div
                class="flex items-start gap-3 rounded-2xl border border-tertiary/10 bg-tertiary-fixed p-2.5 md:p-4"
              >
                <PhoneCall class="mt-0.5 size-5 shrink-0 text-white-fixed" />
                <div>
                  <p class="text-sm font-bold uppercase tracking-wide text-white-fixed">
                    Cần hỗ trợ ngay?
                  </p>
                  <p class="mt-1 text-sm leading-snug text-white-fixed-variant md:leading-relaxed">
                    Gọi hotline
                    <a
                      href="tel:0981128086"
                      class="font-semibold underline-offset-2 hover:underline text-emerald-500"
                    >
                      0981 128 086
                    </a>
                    hoặc nhắn tin qua kênh liên hệ trên website.
                  </p>
                </div>
              </div>

              <div class="flex flex-col gap-2 sm:flex-row md:pt-1">
                <NuxtLink to="/san-pham" class="flex-1">
                  <AtomsButton type="primaryGradient" class="center-child w-full !p-3 md:!p-4">
                    Xem thêm sản phẩm khác
                  </AtomsButton>
                </NuxtLink>
                <NuxtLink to="/lien-he" class="flex-1">
                  <AtomsButton type="outline" class="center-child w-full !p-3 md:!p-4"
                    >Liên hệ hỗ trợ</AtomsButton
                  >
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Thẻ cửa hàng riêng -->
          <div
            class="mt-2 flex flex-col items-center rounded-3xl border border-outline-variant/60 bg-surface p-3 text-center shadow-[0_24px_48px_rgba(216,85,16,0.08)] md:(mt-4 p-6)"
          >
            <!-- Ảnh logo có sẵn chữ ở phần dưới — chỉ cắt bỏ dải chữ, giữ trọn hình con ngựa -->
            <div
              class="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-surface-container-low ring-1 ring-outline-variant md:(h-20 w-20)"
            >
              <span
                class="absolute inset-x-0 top-1/2 block overflow-hidden -translate-y-1/2"
                style="height: 72%"
              >
                <img :src="Logo" alt="Logo Doreto Fashion" class="block h-auto w-full" />
              </span>
            </div>

            <p class="font-noto mt-1 text-lg font-semibold italic text-primary md:text-xl">
              Doreto Fashion
            </p>
            <p
              class="mt-0.5 max-w-md text-center text-base font-medium italic leading-snug text-on-surface md:text-lg"
            >
              Mang phong cách thời trang hiện đại đến người Việt
            </p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle2, PhoneCall, X } from "lucide-vue-next";
import Logo from "~/assets/images/web-logo.png";

const nextSteps = [
  { title: "Liên hệ xác nhận đơn hàng" },
  { title: "Đóng gói, giao hàng tận nơi" },
  { title: "Khách hàng nhận, kiểm tra trước khi thanh toán" },
];

const closePage = () => {
  navigateTo("/");
};

// * VUỐT KÉO XUỐNG ĐỂ ĐÓNG POPUP (cùng cơ chế với popup mua hàng)
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
  if (isDragging.value && dragOffset.value > SHEET_CLOSE_THRESHOLD) {
    closePage();
    return;
  }
  isDragging.value = false;
  dragOffset.value = 0;
};

onMounted(() => {
  document.body.classList.add("body-overflow");
});

onBeforeUnmount(() => {
  document.body.classList.remove("body-overflow");
});

useSeoMeta({
  title: "Cảm ơn bạn đã đặt hàng | Doreto",
  description: "Đơn hàng của bạn đã được ghi nhận thành công tại Doreto.",
  robots: "noindex, nofollow",
});

useBreadcrumbSchema([
  { name: "Trang chủ", path: "/" },
  { name: "Cảm ơn đặt hàng", path: "/cam-on-dat-hang" },
]);
</script>

<style scoped>
@keyframes sheet-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes backdrop-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-sheet-up {
  animation: sheet-up 0.3s ease;
}

.animate-backdrop-in {
  animation: backdrop-in 0.3s ease;
}
</style>
