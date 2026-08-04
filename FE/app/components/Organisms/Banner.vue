<template>
  <div class="banner w-full overflow-hidden rounded-2xl md:rounded-24px">
    <div class="content relative z-2 p-4 pb-6 sm:p-6 md:max-w-560px md:p-(x-8 y-10) lg:p-(x-10 y-12)">
      <p class="text-(#917400 11px) uppercase font-semibold tracking-2px word-spacing-2px sm:text-xs">
        Bộ sưu tập mới
      </p>
      <h1 class="mt-3 whitespace-pre-line text-4xl leading-tight text-primary font-bold sm:mt-4 sm:text-5xl md:mt-6 md:text-6xl lg:text-7xl">
        Phong cách <br />
        của <br />
        riêng bạn
      </h1>

      <p class="mt-4 max-w-360px text-sm leading-6 sm:text-base md:mt-6">
        Trang phục được tuyển chọn kỹ lưỡng, chất liệu cao cấp, giúp bạn tự tin thể hiện phong
        cách riêng mỗi ngày.
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.banner {
  min-height: 320px;
  background-image: url("/banner.webp");
  background-size: cover;
  background-position: right center;
  position: relative;
  overflow: hidden;

  .content {
    position: relative;
    z-index: 2;
    backdrop-filter: blur(1px);
  }

  &::before {
    content: "";
    background: linear-gradient(to right, rgb(236, 236, 236) 20%, rgba(236, 236, 236, 0.5));
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 1;
  }
}

@media (max-width: 1023px) {
  .banner {
    min-height: 280px;
    background-position: center;
  }
}

@media (max-width: 639px) {
  .banner {
    min-height: 230px;
  }
}
</style>
