<template>
  <OrganismsWebHeader />
  <div class="max-w-1312px mx-auto px-4 md:px-8 py-8 flex gap-10">
    <OrganismsCMSSideBar />
    <div class="w-full min-w-0">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ERole, type TUser } from "~/types/user.type";
const authStore = useAuthStore();
const route = useRoute();

// Lớp chặn dự phòng (middleware "admin" đã chặn từ trước khi render).
// Dùng watchEffect để vẫn đá ra ngoài nếu hồ sơ user tải xong muộn hoặc bị logout.
const isAdmin = computed(() => (authStore.user as TUser | null)?.role === ERole.ADMIN);
watchEffect(() => {
  if (!authStore.loadingStates.authStore && route.path.startsWith("/admin") && !isAdmin.value) {
    navigateTo("/");
  }
});
</script>
