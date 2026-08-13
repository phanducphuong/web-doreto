import { defineStore } from "pinia";
import type { TSigninDto, TSignupDto } from "~/types/auth.type";

export const useAuthStore = defineStore("auth", () => {
  const route = useRoute();
  const toast = useToast();
  const user = ref<any>(null);
  const token = useAccessTokenCookie();
  const refreshToken = useRefreshTokenCookie();
  const { $authRepository, runWithContext } = useNuxtApp();
  const loadingStates = ref({
    login: false,
    logout: false,
    signup: false,
    refreshToken: false,
    authStore: false,
  });

  const isLogin = computed(() => !!user.value);

  // * METHODS
  const logout = async () => {
    try {
      loadingStates.value.logout = true;
      await $authRepository.logout();
    } catch (error) {
      // Phiên đã hết hạn (401) thì gọi logout tất trả 401 — coi như đã đăng xuất,
      // KHÔNG bắn toast "Logout failed" (tiếng Anh) đập vào mặt khách. Lỗi khác mới báo.
      const status = (error as { statusCode?: number; status?: number })?.statusCode
        ?? (error as { status?: number })?.status;
      if (status !== 401) {
        toast.error({ message: "Đăng xuất thất bại" });
        console.error(error);
      }
    } finally {
      loadingStates.value.logout = false;
      token.value = null;
      refreshToken.value = null;
      user.value = null;
      // Đang ở trang quản trị mà mất phiên thì đưa về trang chủ (không để kẹt ở /admin)
      if (route.path.startsWith("/admin")) {
        await runWithContext(() => navigateTo("/"));
      }
    }
  };

  const signin = async (credentials: TSigninDto) => {
    try {
      loadingStates.value.login = true;
      const res = await $authRepository.sigin(credentials);
      token.value = res.accessToken;
      refreshToken.value = res.refreshToken;

      user.value = res.user;
      toast.success({ message: "Đăng nhập thành công" });

      return true;
    } catch (error) {
      console.error("Login failed", error);
      toast.error({ message: "Đăng nhập thất bại" });
      return false;
    } finally {
      loadingStates.value.login = false;
    }
  };

  const signup = async (signupPayload: TSignupDto) => {
    try {
      loadingStates.value.signup = true;
      const res = await $authRepository.signup(signupPayload);
      token.value = res.accessToken;
      refreshToken.value = res.refreshToken;
      user.value = res.user;
      toast.success({ message: "Đăng ký thành công" });

      return true;
    } catch (error) {
      console.error("Signup failed", error);
      toast.error({ message: "Đăng ký thất bại" });
      return false;
    } finally {
      loadingStates.value.signup = false;
    }
  };

  const initAuthStore = async () => {
    // Đã có user (VD middleware admin gọi trước) thì không gọi lại /auth/profile
    if (user.value) return;
    try {
      loadingStates.value.authStore = true;
      if (token.value) {
        const res = await $authRepository.verifyToken();
        user.value = res;
      } else {
        throw new Error("Token is required");
      }
    } catch (error) {
      // console.error("Init auth store failed");
      if (route.path.startsWith("/admin")) return runWithContext(() => navigateTo("/"));
      // if (import.meta.client) toast.error({ message: "Verify token that bai" });
    } finally {
      loadingStates.value.authStore = false;
    }
  };

  return {
    loadingStates,
    isLogin,
    user,
    token,
    initAuthStore,
    logout,
    signin,
    signup,
  };
});
