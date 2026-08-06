<template>
  <div class="mx-auto flex max-w-4xl flex-col items-center text-center">
    <div class="mb-6 w-full overflow-hidden">
      <img
        src="/empty-products.png"
        alt="Không tìm thấy sản phẩm phù hợp"
        class="mx-auto block max-w-full object-cover"
      />
    </div>

    <div class="space-y-3 max-w-2xl">
      <p class="text-center text-4xl leading-tight text-on-surface md:text-5xl">
        Không tìm thấy vật phẩm phù hợp
      </p>
      <p class="mx-auto text-(lg center) text-on-surface-variant">
        Hãy thử tìm kiếm với từ khóa khác hoặc khám phá bộ sưu tập đang có.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  (e: "back-to-products"): void;
  (e: "explore-collection"): void;
}>();
</script>
