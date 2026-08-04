/**
 * Khóa hướng vuốt kiểu app TMĐT: vuốt ngang → carousel, vuốt dọc → scroll trang.
 */
export function useTouchAxisCarousel(options: {
  enabled: Ref<boolean>;
  onSwipe?: (direction: 1 | -1) => void;
  onTap?: () => void;
  swipeThreshold?: number;
  lockThreshold?: number;
}) {
  const {
    enabled,
    onSwipe,
    onTap,
    swipeThreshold = 40,
    lockThreshold = 10,
  } = options;

  const rootRef = ref<HTMLElement | null>(null);
  const deltaX = ref(0);
  const isDragging = ref(false);

  let startX = 0;
  let startY = 0;
  let axisLock: "x" | "y" | null = null;

  const resetGesture = () => {
    axisLock = null;
    startX = 0;
    startY = 0;
    deltaX.value = 0;
    isDragging.value = false;
  };

  const onTouchStart = (event: TouchEvent) => {
    if (!enabled.value || event.touches.length !== 1) return;
    const touch = event.touches[0];
    if (!touch) return;

    axisLock = null;
    startX = touch.clientX;
    startY = touch.clientY;
    deltaX.value = 0;
    isDragging.value = true;
  };

  const onTouchMove = (event: TouchEvent) => {
    if (!enabled.value || !isDragging.value || event.touches.length !== 1) return;
    const touch = event.touches[0];
    if (!touch) return;

    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;

    if (axisLock === null) {
      if (Math.abs(dx) < lockThreshold && Math.abs(dy) < lockThreshold) return;
      axisLock = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }

    if (axisLock === "x") {
      event.preventDefault();
      deltaX.value = dx;
      return;
    }

    // Trục dọc: không can thiệp, để trang scroll tự nhiên
    deltaX.value = 0;
  };

  const onTouchEnd = (event: TouchEvent) => {
    if (!enabled.value || !isDragging.value) {
      resetGesture();
      return;
    }

    const touch = event.changedTouches[0];
    const dx = touch ? touch.clientX - startX : deltaX.value;
    const dy = touch ? touch.clientY - startY : 0;

    if (axisLock === "x") {
      if (Math.abs(dx) >= swipeThreshold) {
        onSwipe?.(dx < 0 ? 1 : -1);
      }
    } else if (Math.abs(dx) < swipeThreshold && Math.abs(dy) < swipeThreshold) {
      onTap?.();
    }

    resetGesture();
  };

  const bind = () => {
    const el = rootRef.value;
    if (!el) return;

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
  };

  const unbind = () => {
    const el = rootRef.value;
    if (!el) return;

    el.removeEventListener("touchstart", onTouchStart);
    el.removeEventListener("touchmove", onTouchMove);
    el.removeEventListener("touchend", onTouchEnd);
    el.removeEventListener("touchcancel", onTouchEnd);
  };

  watch(
    [enabled, rootRef],
    () => {
      unbind();
      if (enabled.value && rootRef.value) {
        nextTick(bind);
      }
    },
    { immediate: true },
  );

  onBeforeUnmount(unbind);

  return {
    rootRef,
    deltaX,
    isDragging,
    resetGesture,
  };
}
