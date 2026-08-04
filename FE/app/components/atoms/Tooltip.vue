<template>
  <div
    ref="triggerRef"
    class="inline-flex"
    @mouseenter="handleShow"
    @mouseleave="handleHide"
    @focusin="handleShow"
    @focusout="handleHide"
  >
    <slot />

    <ClientOnly v-if="isLg">
      <Teleport to="body">
        <Transition name="tooltip">
          <div
            v-if="isVisible && content"
            role="tooltip"
            :style="tooltipStyle"
            class="fixed z-[9999] px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap pointer-events-none select-none"
          >
            {{ content }}
            <span :class="['absolute', arrowClasses[position]]" />
          </div>
        </Transition>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { type CSSProperties } from "vue";
type Position = "top" | "bottom" | "left" | "right";

const {
  content = "",
  position = "top",
  showAfter = 0,
  hideAfter = 0,
  disabled = false,
} = defineProps<{
  content?: string;
  position?: Position;
  showAfter?: number;
  hideAfter?: number;
  disabled?: boolean;
}>();

const { isLg } = useDeviceBreakpoint();

const triggerRef = ref<HTMLElement | null>(null);
const isVisible = ref(false);
const rect = ref<DOMRect | null>(null);

let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

const GAP = 6;

const tooltipStyle = computed<CSSProperties>(() => {
  if (!rect.value) return { visibility: "hidden" };
  const r = rect.value;
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;

  switch (position) {
    case "bottom":
      return {
        top: `${r.bottom + GAP}px`,
        left: `${cx}px`,
        transform: "translateX(-50%)",
      };
    case "left":
      return {
        top: `${cy}px`,
        left: `${r.left - GAP}px`,
        transform: "translate(-100%, -50%)",
      };
    case "right":
      return {
        top: `${cy}px`,
        left: `${r.right + GAP}px`,
        transform: "translateY(-50%)",
      };
    case "top":
    default:
      return {
        top: `${r.top - GAP}px`,
        left: `${cx}px`,
        transform: "translate(-50%, -100%)",
      };
  }
});

const arrowClasses: Record<Position, string> = {
  top: "top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800",
  bottom: "bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-800",
  left: "left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-800",
  right: "right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800",
};

// * HELPERS
function clearTimers() {
  if (showTimer) clearTimeout(showTimer);
  if (hideTimer) clearTimeout(hideTimer);
}

function handleShow() {
  if (disabled || !import.meta.client || !isLg.value) return;
  clearTimers();
  rect.value = triggerRef.value?.getBoundingClientRect() ?? null;
  showTimer = setTimeout(() => (isVisible.value = true), showAfter);
}

function handleHide() {
  if (!import.meta.client) return;
  clearTimers();
  hideTimer = setTimeout(() => (isVisible.value = false), hideAfter);
}

// * HOOKS
onUnmounted(clearTimers);
</script>

<style scoped>
.tooltip-enter-active,
.tooltip-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: scale(0.92);
}
</style>
