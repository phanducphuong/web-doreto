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

const isAdmin = computed(() => (authStore.user as TUser | null)?.role === ERole.ADMIN);
if (!authStore.loadingStates.authStore && route.path.startsWith("/admin") && !isAdmin.value) {
  navigateTo("/");
}
</script>
