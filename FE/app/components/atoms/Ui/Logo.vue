<template>
  <NuxtLink to="/" class="w-fit shrink-0 block" aria-label="Trang chủ">
    <!-- Ảnh logo có sẵn chữ ở 1/4 dưới — cắt bớt để chỉ hiện hình con ngựa -->
    <span class="block overflow-hidden w-10 h-7 lg:(w-16 h-11)">
      <img :src="Logo" alt="Logo" class="block w-full h-auto" />
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
import Logo from "~/assets/images/web-logo.png";
</script>
