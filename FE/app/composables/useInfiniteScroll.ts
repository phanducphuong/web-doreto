type MaybeRef<T> = T | Ref<T>;

type UseInfiniteScrollOptions = {
  enabled?: MaybeRef<boolean>;
  canLoadMore?: MaybeRef<boolean> | (() => boolean);
  root?: MaybeRef<Element | Document | null>;
  rootMargin?: string;
  threshold?: number | number[];
};

const resolveCanLoadMore = (value?: MaybeRef<boolean> | (() => boolean)) => {
  if (!value) return true;
  if (typeof value === "function") return value();
  return unref(value);
};

export const useInfiniteScroll = (
  onLoadMore: () => void | Promise<void>,
  options: UseInfiniteScrollOptions = {},
) => {
  const targetRef = ref<HTMLElement | null>(null);
  const isIntersecting = ref(false);
  const isLoading = ref(false);

  let observer: IntersectionObserver | null = null;
  let hasTriggeredInCurrentView = false;

  const unobserve = () => {
    if (observer && targetRef.value) {
      observer.unobserve(targetRef.value);
    }
  };

  const stop = () => {
    unobserve();
    observer?.disconnect();
    observer = null;
  };

  const canObserve = computed(() => unref(options.enabled) ?? true);

  const handleIntersect: IntersectionObserverCallback = async ([entry]) => {
    isIntersecting.value = !!entry?.isIntersecting;

    if (!entry?.isIntersecting) {
      hasTriggeredInCurrentView = false;
      return;
    }

    if (
      !canObserve.value ||
      !resolveCanLoadMore(options.canLoadMore) ||
      isLoading.value ||
      hasTriggeredInCurrentView
    ) {
      return;
    }

    hasTriggeredInCurrentView = true;
    isLoading.value = true;

    try {
      await onLoadMore();
    } finally {
      isLoading.value = false;
      hasTriggeredInCurrentView = false;

      // Re-observe to trigger the next load if sentinel is still in viewport.
      if (observer && targetRef.value && canObserve.value && resolveCanLoadMore(options.canLoadMore)) {
        observer.unobserve(targetRef.value);
        observer.observe(targetRef.value);
      }
    }
  };

  const observe = () => {
    if (!import.meta.client) return;
    if (!canObserve.value || !targetRef.value) return;

    if (!observer) {
      observer = new IntersectionObserver(handleIntersect, {
        root: unref(options.root) ?? null,
        rootMargin: options.rootMargin ?? "0px 0px 200px 0px",
        threshold: options.threshold ?? 0.1,
      });
    }

    observer.observe(targetRef.value);
  };

  watch([targetRef, canObserve], () => {
    stop();
    if (canObserve.value) observe();
  });

  onMounted(observe);
  onUnmounted(stop);

  return {
    targetRef,
    isIntersecting,
    isLoading,
    observe,
    stop,
  };
};
