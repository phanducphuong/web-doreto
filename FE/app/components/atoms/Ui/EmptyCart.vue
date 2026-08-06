<template>
  <section class="w-full flex flex-col items-center text-center z-10">
    <div class="relative mb-7 h-56 w-56 center-child sm:(mb-10 h-72 w-72) md:(mb-12 h-96 w-96)">
      <img
        alt="Giỏ hàng trống"
        class="w-full h-full object-contain mix-blend-multiply opacity-90 transition-transform duration-700 hover:scale-105"
        src="/empty-cart.png"
      />
    </div>
    <div class="animate-fade-in space-y-4 sm:space-y-6">
      <p
        class="text-center text-3xl leading-tight tracking-tight text-on-surface sm:text-4xl md:text-5xl lg:text-6xl"
      >
        Giỏ hàng đang trống
      </p>
      <p
        class="text-center font-body text-sm leading-relaxed text-on-surface-variant/80 sm:text-lg md:text-xl"
      >
        Chưa có sản phẩm nào được chọn để mang lại bình an cho không gian của bạn.
      </p>
      <AtomsButton
        type="primaryGradient"
        class="mx-auto h-unset !rounded-lg !p-(x-7 y-3) !text-sm font-semibold sm:(!p-(x-11 y-4) !text-base)"
        @click="toProducts"
      >
        Khám phá bộ sản phẩm <MoveRight />
      </AtomsButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import { MoveRight } from "lucide-vue-next";

const toProducts = () => {
  navigateTo("/san-pham");
};
</script>
