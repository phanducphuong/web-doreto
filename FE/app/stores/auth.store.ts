import { defineStore } from "pinia";
import type { TSigninDto, TSignupDto } from "~/types/auth.type";

export const useAuthStore = defineStore("auth", () => {
  const route = useRoute();
  const toast = useToast();
  const user = ref<any>(null);
  const token = useCookie("access_token");
  const refreshToken = useCookie("refresh_token");
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

      if (route.path.startsWith("/admin")) return runWithContext(() => navigateTo("/"));
    } catch (error) {
      toast.error({ message: "Logout failed" });
      console.error(error);
    } finally {
      loadingStates.value.logout = false;
      token.value = null;
      refreshToken.value = null;
      user.value = null;
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
