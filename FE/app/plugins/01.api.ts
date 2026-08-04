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
  let refreshPromise: Promise<boolean> | null = null;
  const config = useRuntimeConfig();
  const apiBaseUrl = config.public.apiBaseUrl;

  const plainFetch = $fetch.create({
    baseURL: apiBaseUrl,
  });

  const baseFetch = $fetch.create({
    baseURL: apiBaseUrl,

    onRequest({ options }) {
      const token = useCookie("access_token");
      const headers = new Headers(options.headers);

      if (token.value) {
        headers.set("Authorization", `Bearer ${token.value}`);
      }

      options.headers = headers;
    },
  });

  const runRefresh = (): Promise<boolean> =>
    nuxtApp.runWithContext(async () => {
      const refreshTokenCookie = useCookie("refresh_token");
      const accessTokenCookie = useCookie("access_token");

      if (!refreshTokenCookie.value) return false;

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
        return true;
      } catch {
        return false;
      }
    });

  const ensureRefreshing = (): Promise<boolean> => {
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
    const isRetry = Boolean(resolvedOptions.authRetry);

    try {
      return await baseFetch(request, resolvedOptions);
    } catch (error: unknown) {
      const status = getFetchErrorStatus(error);
      if (status !== 401) throw error;
      if (isAuthPublicOrRefreshUrl(request)) throw error;

      if (isRetry) {
        nuxtApp.runWithContext(() => {
          useAuthStore().logout();
        });
        throw error;
      }

      const refreshed = await ensureRefreshing();
      if (!refreshed) {
        nuxtApp.runWithContext(() => {
          useAuthStore().logout();
        });
        throw error;
      }

      return baseFetch(request, {
        ...resolvedOptions,
        authRetry: true,
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
