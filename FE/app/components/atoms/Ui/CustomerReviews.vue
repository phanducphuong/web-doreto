<template>
  <section>
    <div class="mb-5 flex items-end justify-between md:mb-8">
      <div>
        <h2 class="mb-1 text-2xl font-headline font-bold text-on-surface sm:text-3xl">
          Khách Hàng Nói Gì
        </h2>
        <p class="text-sm text-on-surface-variant sm:text-base">
          Chia sẻ từ những khách hàng đã tin chọn Doreto.
        </p>
      </div>
    </div>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      <div
        v-for="review in reviews"
        :key="review.author"
        class="group flex flex-col rounded-xl bg-surface-container-low p-4 transition-colors hover:bg-white sm:p-6 lg:p-7"
      >
        <AtomsUiRating :rating="5" :truncate="false" class="mb-3 sm:mb-4" />
        <p class="mb-5 text-sm text-on-surface italic sm:mb-6 sm:text-base">{{ review.content }}</p>
        <p class="mt-auto text-sm font-bold">{{ review.author }}</p>
        <p class="text-[10px] text-stone-500 uppercase font-bold tracking-widest">Verified Buyer</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const reviews = [
  {
    author: "Ngô Mạnh Linh",
    content: `"Chất vải rất đẹp, đường may chắc chắn. Mặc lên form chuẩn như hình, mình đã quay lại mua thêm mấy món nữa."`,
  },
  {
    author: "Phùng Gia Hiến",
    content: `"Dịch vụ chăm sóc khách hàng của Doreto rất tuyệt vời. Shop tư vấn size rất kỹ theo chiều cao cân nặng của mình."`,
  },
  {
    author: "Trần Thanh Hiền",
    content:
      "Đóng gói rất chỉn chu, giao hàng nhanh. Rất an tâm khi mua làm quà tặng người thân.",
  },
];
</script>
