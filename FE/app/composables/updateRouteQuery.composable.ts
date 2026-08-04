import { useRouter, useRoute } from "vue-router";

type QueryValue = string | number | null | undefined;

export function useUpdateRouteQuery() {
  const router = useRouter();
  const route = useRoute();

  const updateQuery = (params: Record<string, QueryValue>) => {
    const newQuery: Record<string, any> = { ...route.query };

    let changed = false;

    Object.keys(params).forEach((key) => {
      const value = params[key];

      if (value !== undefined && value !== null && value !== "") {
        if (newQuery[key] !== value) {
          newQuery[key] = String(value);
          changed = true;
        }
      } else {
        if (key in newQuery) {
          delete newQuery[key];
          changed = true;
        }
      }
    });

    // tránh replace nếu không có thay đổi
    if (changed) {
      router.replace({ query: newQuery });
    }
  };

  return { updateQuery };
}
