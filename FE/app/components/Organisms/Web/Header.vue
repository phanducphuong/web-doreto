<template>
  <div
    class="sticky top-0 z-[21] w-full bg-black text-white shadow-sm transition-transform duration-300 ease-in-out"
    :class="{ '-translate-y-full': isHeaderHidden }"
  >
    <div class="mx-auto flex max-w-1312px items-center gap-3 px-4 py-1.5 md:px-8 lg:py-2">
      <AtomsUiLogo />

      <div class="ml-6 hidden items-center gap-6 lg:flex">
        <NuxtLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="relative whitespace-nowrap text-sm font-medium transition-colors hover:text-primary"
          :class="{ 'text-primary font-semibold': $route.path === item.to }"
        >
          {{ item.label }}

          <span
            v-if="$route.path === item.to"
            class="absolute -bottom-1.5 left-1/2 h-0.5 w-full -translate-x-1/2 rounded-full bg-primary animate-underline"
          />
        </NuxtLink>
      </div>

      <AtomsFormInput
        v-model="searchKeyword"
        class="ml-auto hidden w-50 border-none !rounded-full !bg-#F6F3F2 !ring-none"
        :suffix-icon="Search"
        placeholder="Tìm kiếm ..."
        @keydown.enter.prevent="onSubmitSearch"
      />

      <div class="ml-auto flex items-center gap-2 lg:ml-0">
        <MoleculesCart />
        <MoleculesPopoverUser />
        <MoleculesCommonPopover ref="mobileMenuPopoverRef" placement="bottom-end">
          <AtomsButton class="!h-10 !w-10 lg:!hidden" type="ghost" circle aria-label="Menu">
            <Menu :size="24" class="shrink-0" />
          </AtomsButton>
          <template #content>
            <ClientOnly>
              <div class="w-48 space-y-1 p-1">
                <NuxtLink
                  v-for="item in items"
                  :key="item.to"
                  :to="item.to"
                  class="block rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-container-low"
                  :class="{ 'bg-surface-container-low text-primary': $route.path === item.to }"
                  @click="onMobileMenuNavigate"
                >
                  {{ item.label }}
                </NuxtLink>
              </div>
            </ClientOnly>
          </template>
        </MoleculesCommonPopover>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Menu, Search } from "lucide-vue-next";

const route = useRoute();
const searchKeyword = ref("");
const mobileMenuPopoverRef = ref<{
  close?: () => void;
} | null>(null);

const items = [
  {
    label: "Trang chủ",
    to: "/",
  },
  {
    label: "Sản phẩm",
    to: "/san-pham",
  },
  {
    label: "Liên hệ",
    to: "/lien-he",
  },
];

const onSubmitSearch = () => {
  const keyword = searchKeyword.value.trim();
  if (!keyword) {
    navigateTo("/san-pham");
    return;
  }

  navigateTo({
    path: "/tim-kiem",
    query: { q: keyword },
  });
};

const onMobileMenuNavigate = () => {
  mobileMenuPopoverRef.value?.close?.();
};

// Ẩn header khi cuộn xuống, hiện lại khi cuộn lên
const isHeaderHidden = ref(false);
let lastScrollY = 0;

const onWindowScroll = () => {
  const currentY = window.scrollY;

  if (currentY <= 0) {
    isHeaderHidden.value = false;
  } else if (currentY > lastScrollY && currentY > 80) {
    isHeaderHidden.value = true;
    mobileMenuPopoverRef.value?.close?.();
  } else if (currentY < lastScrollY) {
    isHeaderHidden.value = false;
  }

  lastScrollY = currentY;
};

onMounted(() => {
  lastScrollY = window.scrollY;
  window.addEventListener("scroll", onWindowScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", onWindowScroll);
});

watch(
  () => route.query.q,
  (queryValue) => {
    searchKeyword.value = route.path === "/tim-kiem" ? String(queryValue || "") : "";
  },
  { immediate: true },
);
</script>

<style lang="scss">
@keyframes underline {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}

.animate-underline {
  animation: underline 0.3s ease-in-out;
}
</style>
