<template>
  <section class="relative overflow-hidden rounded-xl bg-primary p-4 text-white sm:p-6 lg:p-8">
    <div class="relative z-10">
      <h3 class="mb-3 flex items-center gap-2 font-headline text-lg font-bold sm:(mb-4 text-xl)">
        <Lightbulb class="size-5 sm:size-7" /> Gợi Ý
      </h3>
      <p class="mb-4 text-xs leading-relaxed opacity-90 sm:(mb-6 text-sm)">
        Chọn trang phục vừa vặn với vóc dáng luôn quan trọng hơn chạy theo mốt. Ưu tiên form áo ôm
        nhẹ ở vai và eo, phối tối đa ba tông màu để tổng thể gọn gàng, lịch lãm.
      </p>
      <div class="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-md sm:p-4">
        <p class="mb-1 text-10px font-bold uppercase tracking-tighter opacity-80 underline sm:text-xs">
          Mẹo hữu ích
        </p>
        <p class="text-xs italic sm:text-sm">
          "Giặt áo với nước lạnh và lộn trái khi phơi để giữ màu vải bền đẹp và form dáng lâu hơn."
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Lightbulb } from "lucide-vue-next";
</script>
