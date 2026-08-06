<template>
  <NuxtLink to="/" class="w-fit shrink-0 block" aria-label="Trang chủ">
    <span class="block h-7 lg:h-10">
      <img :src="Logo" alt="Logo Doreto" class="block h-full w-auto object-contain" />
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
import Logo from "~/assets/images/web-logo.png";
</script>
