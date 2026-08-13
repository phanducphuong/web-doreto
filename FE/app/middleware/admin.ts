import { ERole, type TUser } from "~/types/user.type";

// Chặn mọi route /admin: chỉ tài khoản role admin mới được vào.
// Chạy TRƯỚC khi trang render (cả SSR lẫn chuyển trang phía client),
// nên user thường không thấy giao diện quản trị lóe lên nữa.
export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore();
  const token = useAccessTokenCookie();

  if (!token.value) return navigateTo("/");

  // Middleware chạy trước app.vue nên hồ sơ user có thể chưa được tải
  if (!authStore.user) {
    await authStore.initAuthStore();
  }

  if ((authStore.user as TUser | null)?.role !== ERole.ADMIN) {
    return navigateTo("/");
  }
});
