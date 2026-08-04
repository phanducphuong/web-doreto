<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ClientOnly>
    <MoleculesCommonImageLightboxProvider />
    <AtomsUiFloatingContactChannels />

    <Teleport to="body" v-if="route.name !== 'chi-tiet-san-pham'">
      <AtomsButton
        v-show="showScrollToTop"
        type="primary"
        circle
        class="fixed bottom-6 right-4 z-40 !h-11 !w-11 shadow-lg transition-opacity md:(bottom-8 right-8)"
        :icon="ChevronUp"
        aria-label="Về đầu trang"
        @click="scrollToTop"
      />
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ChevronUp } from "lucide-vue-next";

const { initAuthStore } = useAuthStore();
const { fetchCategories, fetchCategoriesCount } = useCategoryStore();
const route = useRoute();

const showScrollToTop = ref(false);
const SCROLL_TOP_THRESHOLD = 400;

const updateScrollToTopVisibility = () => {
  showScrollToTop.value = window.scrollY > SCROLL_TOP_THRESHOLD;
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const robotsMeta = computed(() => {
  const path = route.path || "";
  const isAdminPage = path.startsWith("/admin");
  const isUserPrivatePage = path === "/profile" || path === "/profile/order-history";

  return isAdminPage || isUserPrivatePage ? "noindex, nofollow" : "index, follow";
});

useSeoMeta({
  robots: () => robotsMeta.value,
});

// iOS Safari giữ nguyên mức zoom cũ khi chuyển trang trong SPA (không tải lại trang),
// nên nếu trang lỡ bị zoom thì sang trang khác vẫn dính. Ghi lại thẻ meta viewport
// để Safari kẹp scale về 1 sau mỗi lần chuyển trang.
const resetViewportZoom = () => {
  const meta = document.querySelector('meta[name="viewport"]');
  if (!(meta instanceof HTMLMetaElement)) return;
  // Loại bỏ minimum-scale cũ trước khi thêm để không bị cộng dồn khi reset liên tiếp
  const base = meta.content.replace(/,?\s*minimum-scale=1/g, "");
  meta.content = `${base}, minimum-scale=1`;
  // Dùng setTimeout thay vì requestAnimationFrame vì rAF không chạy khi tab ở nền
  setTimeout(() => {
    meta.content = base;
  }, 100);
};

const router = useRouter();

onMounted(() => {
  document.documentElement.classList.add("app-transitions-enabled");
  updateScrollToTopVisibility();
  window.addEventListener("scroll", updateScrollToTopVisibility, { passive: true });

  resetViewportZoom();
  router.afterEach(() => {
    setTimeout(resetViewportZoom, 50);
  });
});

onUnmounted(() => {
  window.removeEventListener("scroll", updateScrollToTopVisibility);
});

await useAsyncData("initAuthStore", async () => {
  await Promise.all([initAuthStore(), fetchCategories(), fetchCategoriesCount()]);
  return true;
});
</script>
