<template>
  <div>
    <AtomsButton
      v-if="!authStore.user && !authStore.loadingStates.authStore"
      type="ghost"
      class="w-10 h-10"
      circle
      aria-label="Đăng ký / đăng nhập"
      @click="openSignInUpModal"
    >
      <User :size="22" class="shrink-0" />
    </AtomsButton>

    <AtomsButton
      v-else-if="authStore.user"
      type="ghost"
      class="w-10 h-10"
      circle
      :class="{
        'text-primary !bg-third-light/10': isUserRoute,
      }"
      @click="toggleUserDrawer"
    >
      <User :size="20" class="shrink-0" />
    </AtomsButton>

    <ClientOnly>
      <Teleport to="body">
        <div
          v-show="drawerOpen"
          class="fixed inset-0 z-[45] bg-black/40 transition-opacity"
          aria-hidden="true"
          @click="closeUserDrawer"
        />

        <MoleculesCommonDrawer
          ref="userDrawerRef"
          placement="right"
          class="fixed z-50 h-screen bg-white shadow-2xl"
          :style="{ width: `${drawerWidth}px` }"
        >
          <div class="flex h-full flex-col border-l border-base">
            <div
              class="flex items-center justify-between border-b border-outline-variant/30 p-3 sm:p-4"
            >
              <span class="text-(primary lg) font-bold sm:text-xl">Tài khoản</span>
              <AtomsButton type="ghost" circle class="h-9 w-9 shrink-0" @click="closeUserDrawer">
                <X :size="18" class="shrink-0" />
              </AtomsButton>
            </div>

            <div class="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3 sm:(gap-4 px-4 py-4)">
              <dl class="space-y-3">
                <div v-for="row in profileRows" :key="row.label">
                  <dt class="text-xs font-medium uppercase tracking-wide text-third-light">
                    {{ row.label }}
                  </dt>
                  <dd :class="['mt-0.5', row.breakAll && 'break-all']">
                    {{ row.value }}
                  </dd>
                </div>
              </dl>

              <AtomsButton
                v-show="route.name !== action.routeName"
                v-for="action in userActions"
                :key="action.routeName"
                type="outline"
                class="w-full !py-3 h-unset !text-sm sm:(!py-4 !text-base)"
                @click="navigateToRoute(action.routeName)"
              >
                <component :is="action.icon" :size="20" />
                {{ action.label }}
              </AtomsButton>

              <AtomsButton
                v-if="isAdmin"
                type="primaryGradient"
                class="w-full !py-3 h-unset !text-sm sm:(!py-4 !text-base)"
                @click="openAdminDashboard"
              >
                <Shield :size="20" />
                Vào trang quản trị
              </AtomsButton>
            </div>

            <div
              class="mt-auto border-t border-outline-variant/30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4"
            >
              <button
                type="button"
                class="bg-surface-container-high w-full hover:bg-surface-container-highest text-on-surface py-4 sm:py-5 rounded-lg center-child gap-2 transition-all active:scale-95 cursor-pointer"
                :is-loading="authStore.loadingStates.logout"
                @click="onLogout"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </MoleculesCommonDrawer>
      </Teleport>
    </ClientOnly>

    <OrganismsSignInUpModal />
  </div>
</template>

<script setup lang="ts">
import { User, X, Shield, ReceiptText } from "lucide-vue-next";
import type { Component } from "vue";
import MoleculesCommonDrawer from "./common/Drawer.vue";
import OrganismsSignInUpModal from "~/components/Organisms/SignInUpModal.vue";
import { ERole, type TUser } from "~/types/user.type";

const { $event } = useNuxtApp();
const authStore = useAuthStore();
const route = useRoute();

const userDrawerRef = ref<InstanceType<typeof MoleculesCommonDrawer>>();
const drawerOpen = ref(false);
const DRAWER_MAX_WIDTH = 22 * 16;
const DRAWER_MOBILE_WIDTH_RATIO = 0.9;
const viewportWidth = ref(0);

const drawerWidth = computed(() => {
  if (!import.meta.client || !viewportWidth.value) return DRAWER_MAX_WIDTH;
  if (viewportWidth.value < 480) return viewportWidth.value;
  return Math.min(DRAWER_MAX_WIDTH, viewportWidth.value * DRAWER_MOBILE_WIDTH_RATIO);
});

const user = computed(() => authStore.user as TUser | null);

type TUserRouteName = "user-profile" | "user-order-history";

type TUserAction = {
  label: string;
  routeName: TUserRouteName;
  icon: Component;
};

const userActions: TUserAction[] = [
  {
    label: "Trang cá nhân",
    routeName: "user-profile",
    icon: User,
  },
  {
    label: "Lịch sử đơn hàng",
    routeName: "user-order-history",
    icon: ReceiptText,
  },
];

const isUserRoute = computed(() => userActions.some((action) => action.routeName === route.name));

const displayName = computed(() => user.value?.name?.trim() || "—");
const displayEmail = computed(() => user.value?.email?.trim() || "—");
const displayPhone = computed(() => user.value?.phoneNumber?.trim() || "—");

const profileRows = computed<{ label: string; value: string; breakAll?: boolean }[]>(() => [
  { label: "Họ tên", value: displayName.value },
  { label: "Email", value: displayEmail.value, breakAll: true },
  { label: "Số điện thoại", value: displayPhone.value },
]);

const isAdmin = computed(() => user.value?.role === ERole.ADMIN);

function openDrawerCoords() {
  if (!import.meta.client) return { x: "100vw" as const, y: "0px" as const };
  const vw = viewportWidth.value || window.innerWidth;
  const panelW = drawerWidth.value;
  return { x: `${Math.max(0, vw - panelW)}px`, y: "0px" };
}

function toggleUserDrawer() {
  userDrawerRef.value?.toggle(openDrawerCoords());
  nextTick(() => {
    drawerOpen.value = !!unref(userDrawerRef.value?.isOpen);
  });
}

const openAdminDashboard = () => {
  navigateTo({
    name: "admin-dashboard",
  });
  closeUserDrawer();
};

const navigateToRoute = (routeName: TUserRouteName) => {
  navigateTo({ name: routeName });
  closeUserDrawer();
};

function closeUserDrawer() {
  userDrawerRef.value?.close();
  drawerOpen.value = false;
}

watch(
  () => authStore.user,
  () => {
    if (!authStore.user) closeUserDrawer();
  },
);

const openSignInUpModal = () => {
  $event("auth:open-sign-modal", { type: "sign-in" });
};

const onLogout = async () => {
  await authStore.logout();
  closeUserDrawer();
};

const updateViewportWidth = () => {
  if (!import.meta.client) return;
  viewportWidth.value = window.innerWidth;
};

onMounted(() => {
  updateViewportWidth();
  window.addEventListener("resize", updateViewportWidth, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateViewportWidth);
});
</script>
