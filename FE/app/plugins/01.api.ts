const notRetryRoute = ["/auth/signin", "/auth/signup", "/auth/refresh", "/auth/logout"];

type TFetchOptionsWithAuthRetry = NonNullable<Parameters<typeof $fetch>[1]> & {
  authRetry?: boolean;
};

function getFetchErrorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  if ("statusCode" in error && typeof (error as { statusCode: unknown }).statusCode === "number") {
    return (error as { statusCode: number }).statusCode;
  }
  if ("status" in error && typeof (error as { status: unknown }).status === "number") {
    return (error as { status: number }).status;
  }
  return undefined;
}

function isAuthPublicOrRefreshUrl(request: unknown): boolean {
  const url = String(request ?? "");
  return Boolean(notRetryRoute.find((route) => url.includes(route)));
}

export default defineNuxtPlugin((nuxtApp) => {
  // runRefresh trả về access token MỚI (hoặc null nếu refresh thất bại), không phải boolean —
  // cần token này để gắn thẳng vào header lần thử lại (xem wrappedFetch).
  let refreshPromise: Promise<string | null> | null = null;
  const config = useRuntimeConfig();
  const apiBaseUrl = config.public.apiBaseUrl;

  const plainFetch = $fetch.create({
    baseURL: apiBaseUrl,
  });

  const baseFetch = $fetch.create({
    baseURL: apiBaseUrl,

    onRequest({ options }) {
      const headers = new Headers(options.headers);

      // Nếu caller đã gắn Authorization tường minh (lần thử lại sau refresh) thì GIỮ NGUYÊN.
      // Trước đây luôn ghi đè bằng token đọc từ cookie; khi SSR, cookie đọc lại là header
      // của request gốc (token CŨ đã hết hạn) → lần thử lại vẫn 401. Nay chỉ đọc cookie khi
      // caller chưa tự set token.
      if (!headers.has("Authorization")) {
        const token = useAccessTokenCookie();
        if (token.value) {
          headers.set("Authorization", `Bearer ${token.value}`);
        }
      }

      options.headers = headers;
    },
  });

  const runRefresh = (): Promise<string | null> =>
    nuxtApp.runWithContext(async () => {
      const refreshTokenCookie = useRefreshTokenCookie();
      const accessTokenCookie = useAccessTokenCookie();

      if (!refreshTokenCookie.value) return null;

      try {
        const res = await plainFetch<{ accessToken: string; refreshToken: string }>(
          "/auth/refresh",
          {
            method: "POST",
            body: { refreshToken: refreshTokenCookie.value },
          },
        );
        accessTokenCookie.value = res.accessToken;
        refreshTokenCookie.value = res.refreshToken;
        return res.accessToken;
      } catch {
        return null;
      }
    });

  const ensureRefreshing = (): Promise<string | null> => {
    if (!refreshPromise) {
      refreshPromise = runRefresh().finally(() => {
        refreshPromise = null;
      });
    }
    return refreshPromise;
  };

  const wrappedFetch = async (
    request: Parameters<typeof $fetch>[0],
    opts?: Parameters<typeof $fetch>[1],
  ) => {
    const resolvedOptions = (opts ?? {}) as TFetchOptionsWithAuthRetry;

    try {
      return await baseFetch(request, resolvedOptions);
    } catch (error: unknown) {
      const status = getFetchErrorStatus(error);
      if (status !== 401) throw error;
      if (isAuthPublicOrRefreshUrl(request)) throw error;
      // Đã là lần thử lại mà vẫn 401 → refresh không cứu được, dọn phiên.
      if (resolvedOptions.authRetry) {
        nuxtApp.runWithContext(() => {
          useAuthStore().logout();
        });
        throw error;
      }

      const freshToken = await ensureRefreshing();
      if (!freshToken) {
        nuxtApp.runWithContext(() => {
          useAuthStore().logout();
        });
        throw error;
      }

      // Gắn token mới THẲNG vào header (không phụ thuộc cookie — quan trọng khi SSR),
      // và đánh dấu authRetry để nếu vẫn 401 thì không lặp vô hạn.
      const retryHeaders = new Headers(resolvedOptions.headers as HeadersInit | undefined);
      retryHeaders.set("Authorization", `Bearer ${freshToken}`);
      return baseFetch(request, {
        ...resolvedOptions,
        authRetry: true,
        headers: retryHeaders,
      });
    }
  };

  const api = Object.assign(wrappedFetch, baseFetch) as typeof $fetch;

  return {
    provide: {
      api,
    },
  };
});
