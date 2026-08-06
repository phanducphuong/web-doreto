<template>
  <section class="px-4 mx-auto max-w-1200px w-full">
    <div class="mb-6">
      <h1 class="cms-title">Lịch sử đơn hàng</h1>
      <p class="mt-1 text-sm text-outline">Theo dõi các đơn hàng gần đây của bạn.</p>
    </div>

    <MoleculesOrderHistory />
  </section>
</template>

<script setup lang="ts">
useSeoMeta({
  title: "Lịch sử đơn hàng | Doreto",
  description: "Theo dõi trạng thái và lịch sử các đơn hàng thời trang nam gần đây của bạn tại Doreto.",
});

useBreadcrumbSchema([
  { name: "Trang chủ", path: "/" },
  { name: "Lịch sử đơn hàng", path: "/order-history" },
]);
</script>
