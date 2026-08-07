<template>
  <div class="space-y-3 sm:space-y-4">
    <!-- * THẺ THÔNG TIN SHOP (kiểu TikTok Shop) -->
    <div class="rounded-xl bg-white p-4 shadow-sm sm:p-6">
      <div class="flex items-center gap-3 sm:gap-4">
        <!-- Avatar logo D: nền tròn đen kín, chữ D phóng to canh giữa -->
        <div
          class="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-black ring-1 ring-white/15 sm:(h-24 w-24)"
        >
          <img
            :src="Logo"
            alt="Logo Doreto"
            class="absolute left-1/2 top-1/2 h-full w-full -translate-x-[54%] -translate-y-1/2 scale-[1.2] object-cover"
          />
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="flex items-center gap-1 text-base font-bold leading-snug text-on-surface sm:text-lg">
            <span class="line-clamp-2">{{ shopInfo.name }}</span>
            <!-- Tích xanh xác minh (giống Facebook): nền xanh, viền + dấu tích trắng -->
            <BadgeCheck class="size-4.5 shrink-0 text-white sm:size-5" style="fill: #1877f2" />
          </h3>
          <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-on-surface-variant sm:text-sm">
            <span class="flex items-center gap-1 font-semibold text-amber-500">
              <Star class="size-3.5 fill-current" />
              {{ shopInfo.rating }}
            </span>
            <span class="text-outline">|</span>
            <span>{{ shopInfo.soldCount }} đã bán</span>
          </div>
        </div>
      </div>
      <div
        class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-outline-variant/30 pt-3 text-xs text-on-surface-variant sm:text-sm"
      >
        <span>
          <b class="text-on-surface">{{ shopInfo.replyRate }}%</b> phản hồi trong 24 giờ
        </span>
        <span>
          <b class="text-on-surface">{{ shopInfo.shippingRate }}%</b> vận chuyển trong 48 giờ
        </span>
      </div>
    </div>

    <!-- * ĐÁNH GIÁ CỦA KHÁCH VỀ CỬA HÀNG -->
    <div class="rounded-xl bg-white p-4 shadow-sm sm:p-6">
      <h4 class="text-base font-bold text-on-surface sm:text-lg">
        Đánh giá của khách về cửa hàng ({{ reviewSummary.total }})
      </h4>

      <!-- Giữ 1 hàng: không xuống dòng, tràn thì cuộn ngang -->
      <div class="scrollbar-none mt-3 flex gap-1 overflow-x-auto whitespace-nowrap sm:gap-2">
        <button
          v-for="filter in reviewFilters"
          :key="filter.label + filter.count"
          type="button"
          class="flex flex-shrink-0 items-center gap-0.5 rounded-full bg-surface-container-low px-2 py-1 text-10px text-on-surface-variant ring-1 ring-outline-variant/60 transition-colors cursor-pointer hover:(bg-primary/8 ring-primary/45 text-on-surface) sm:(gap-1 px-3 py-1.5 text-sm)"
        >
          <Camera v-if="filter.icon === 'camera'" class="size-3" />
          <template v-else-if="filter.stars">
            {{ filter.stars }}
            <Star class="size-2.5 fill-amber-400 text-amber-400 sm:size-3" />
          </template>
          {{ filter.label }} ({{ filter.count }})
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { BadgeCheck, Camera, Star } from "lucide-vue-next";
import Logo from "~/assets/images/web-logo.png";

// ! Số liệu ảo để test UI — sau này thay bằng dữ liệu thật từ API
const shopInfo = {
  name: "Doreto",
  rating: 4.7,
  soldCount: "16,6K",
  replyRate: 98,
  shippingRate: 84,
};

const reviewSummary = {
  total: 451,
};

const reviewFilters = [
  { label: "Có ảnh/video", count: 80, icon: "camera" },
  { label: "", count: 272, stars: 5 },
  { label: "", count: 46, stars: 4 },
  { label: "", count: 31, stars: 3 },
  { label: "", count: 4, stars: 2 },
  { label: "", count: 3, stars: 1 },
];

</script>
