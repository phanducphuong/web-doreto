<template>
  <section>
    <div class="mb-5 flex items-end justify-between md:mb-8">
      <div>
        <h2 class="mb-1 text-2xl font-headline font-bold text-on-surface sm:text-3xl">
          Khách Hàng Nói Gì
        </h2>
        <p class="text-sm text-on-surface-variant sm:text-base">
          Chia sẻ từ những khách hàng đã tin chọn thời trang nam Doreto.
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
    content: `"Chất vải dày dặn, đường may chắc chắn. Form áo chuẩn người, mặc lên trẻ trung mà vẫn lịch sự."`,
  },
  {
    author: "Phùng Gia Hiến",
    content: `"Dịch vụ tư vấn của Doreto rất tận tình. Nhân viên gợi ý size và cách phối đồ đúng gu của mình luôn."`,
  },
  {
    author: "Trần Thanh Hiền",
    content:
      "Giao hàng nhanh, đóng gói đẹp và gọn gàng. Quần đúng form, đứng dáng, mình sẽ ủng hộ shop dài dài.",
  },
];
</script>
