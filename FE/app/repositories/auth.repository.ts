import type { TSigninDto, TSignupDto } from "~/types/auth.type";

export const createAuthRepository = ($api: typeof $fetch) => ({
  sigin: async (body: TSigninDto): Promise<any> =>
    $api("/auth/signin", {
      method: "POST",
      body,
    }),

  signup: async (body: TSignupDto): Promise<any> =>
    $api("/auth/signup", {
      method: "POST",
      body,
    }),

  logout: (): Promise<any> =>
    $api("/auth/logout", {
      method: "POST",
    }),

  verifyToken: (): Promise<any> => $api("auth/profile"),
});
