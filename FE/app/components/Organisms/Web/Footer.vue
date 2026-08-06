<template>
  <div
    class="mx-auto flex max-w-1312px flex-col items-center border-(t solid primary/5) px-4 pt-8 text-center md:(px-8 pt-10)"
    :class="hasBottomCtaBar ? 'pb-32 lg:pb-10' : 'pb-8 md:pb-10'"
  >
    <NuxtLink to="/" aria-label="Trang chủ" class="flex items-center gap-2.5 sm:gap-3">
      <span class="block h-9 shrink-0 sm:h-11">
        <img :src="Logo" alt="Logo Doreto" class="block h-full w-auto object-contain" />
      </span>
      <h4 class="font-noto text-xl font-semibold italic text-primary sm:text-2xl">Doreto</h4>
    </NuxtLink>

    <p
      class="mt-2.5 max-w-2xl text-center text-sm font-medium uppercase tracking-[0.35em] text-on-surface sm:text-base"
    >
      Rise · Improve · Evolve
    </p>

    <!-- * THÔNG TIN CÔNG TY -->
    <div class="mt-5 flex flex-col items-center gap-2 text-xs text-on-surface-variant sm:text-sm">
      <p class="font-semibold text-on-surface">Công Ty TNHH Phương Linh</p>
      <a
        :href="`tel:${CONTACT_PHONE}`"
        class="flex items-center gap-2 transition-colors hover:text-primary"
      >
        <Phone class="size-4 shrink-0 text-primary" />
        <span>{{ CONTACT_PHONE_DISPLAY }}</span>
      </a>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Phone } from "lucide-vue-next";
import Logo from "~/assets/images/web-logo.png";

const route = useRoute();

// Trang chi tiết sản phẩm có thanh "Mua ngay" cố định đáy (mobile) — chừa thêm khoảng trống
// để cuộn xuống vẫn xem hết footer, không bị thanh này che
const hasBottomCtaBar = computed(() => route.name === "chi-tiet-san-pham");

const CONTACT_PHONE = "0981128086";
const CONTACT_PHONE_DISPLAY = "0981 128 086";
</script>
