type TBreakpointKey = "sm" | "md" | "lg" | "xl" | "2xl";
type TBreakpointWithXs = "xs" | TBreakpointKey;

const TAILWIND_BREAKPOINTS: Record<TBreakpointKey, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

export const useDeviceBreakpoint = () => {
  const viewportWidth = ref(0);

  const updateViewportWidth = () => {
    if (!import.meta.client) return;
    viewportWidth.value = window.innerWidth;
  };

  onMounted(() => {
    updateViewportWidth();
    window.addEventListener("resize", updateViewportWidth, { passive: true });
  });

  onBeforeUnmount(() => {
    if (!import.meta.client) return;
    window.removeEventListener("resize", updateViewportWidth);
  });

  const currentBreakpoint = computed<TBreakpointWithXs>(() => {
    if (viewportWidth.value >= TAILWIND_BREAKPOINTS["2xl"]) return "2xl";
    if (viewportWidth.value >= TAILWIND_BREAKPOINTS.xl) return "xl";
    if (viewportWidth.value >= TAILWIND_BREAKPOINTS.lg) return "lg";
    if (viewportWidth.value >= TAILWIND_BREAKPOINTS.md) return "md";
    if (viewportWidth.value >= TAILWIND_BREAKPOINTS.sm) return "sm";
    return "xs";
  });

  const isSm = computed(() => viewportWidth.value >= TAILWIND_BREAKPOINTS.sm);
  const isMd = computed(() => viewportWidth.value >= TAILWIND_BREAKPOINTS.md);
  const isLg = computed(() => viewportWidth.value >= TAILWIND_BREAKPOINTS.lg);
  const isXl = computed(() => viewportWidth.value >= TAILWIND_BREAKPOINTS.xl);
  const is2Xl = computed(() => viewportWidth.value >= TAILWIND_BREAKPOINTS["2xl"]);

  const up = (breakpoint: TBreakpointKey) =>
    computed(() => viewportWidth.value >= TAILWIND_BREAKPOINTS[breakpoint]);

  const down = (breakpoint: TBreakpointKey) =>
    computed(() => viewportWidth.value < TAILWIND_BREAKPOINTS[breakpoint]);

  const between = (min: TBreakpointKey, max: TBreakpointKey) =>
    computed(
      () =>
        viewportWidth.value >= TAILWIND_BREAKPOINTS[min] &&
        viewportWidth.value < TAILWIND_BREAKPOINTS[max],
    );

  return {
    breakpoints: TAILWIND_BREAKPOINTS,
    viewportWidth: readonly(viewportWidth),
    currentBreakpoint,
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
    up,
    down,
    between,
  };
};
