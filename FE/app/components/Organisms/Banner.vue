<template>
  <!-- Ảnh banner (public/banner.jpg) đã có sẵn slogan + logo — không phủ chữ đè lên. -->
  <div class="banner w-full overflow-hidden rounded-2xl md:rounded-24px" role="img" aria-label="Doreto — Rise Improve Evolve" />
</template>

<style scoped lang="scss">
.banner {
  position: relative;
  min-height: 340px;
  background: url("/banner.jpg") center / cover no-repeat;
  overflow: hidden;
}

@media (max-width: 1023px) {
  .banner {
    min-height: 300px;
  }
}

@media (max-width: 639px) {
  .banner {
    min-height: 240px;
  }
}
</style>
