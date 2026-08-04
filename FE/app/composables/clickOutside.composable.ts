export const useClickOutside = (
  callback: () => void,
  excludeRefs: Ref<HTMLElement | null>[] = [],
) => {
  const elementRef = ref<HTMLElement | null>(null);

  const handler = (event: MouseEvent) => {
    const target = event.target as Node;

    const isInsideMain = elementRef.value?.contains(target);
    const isInsideExclude = excludeRefs.some((r) => r.value?.contains(target));

    if (!isInsideMain && !isInsideExclude) {
      callback();
    }
  };

  onMounted(() => document.addEventListener("mousedown", handler));
  onUnmounted(() => document.removeEventListener("mousedown", handler));

  return { elementRef };
};
