<template>
  <div class="w-full">
    <div @click="toggle()" class="mb-3">
      <slot name="trigger" :is-open="isOpen" :toggle="toggle" :open="open" :close="close">
        <div
          class="flex justify-between items-center border-(b solid third-light/30) p-(x-1.5 y-2) cursor-pointer hover:(bg-third-light/10)"
        >
          <span class="text-(lg primary) font-semibold">{{ title }}</span>
          <span
            class="inline-block mt-1 transition-transform duration-200 ease-out"
            :class="{ 'rotate-180': isOpen }"
          >
            <ChevronDown class="size-5" />
          </span>
        </div>
      </slot>
    </div>

    <div ref="containerRef" class="[will-change:height,opacity]">
      <div ref="contentRef" class="min-h-0">
        <slot :is-open="isOpen" :toggle="toggle" :open="open" :close="close" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    defaultOpen?: boolean;
    disabled?: boolean;
    duration?: number;
    easing?: string;
    title?: string;
    unmountOnClose?: boolean;
  }>(),
  {
    modelValue: undefined,
    defaultOpen: true,
    disabled: false,
    duration: 260,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    title: "Toggle",
    unmountOnClose: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "toggle", value: boolean): void;
  (e: "after-open"): void;
  (e: "after-close"): void;
}>();

const uncontrolledOpen = ref(props.defaultOpen);
const containerRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);

let cleanupTransitionEnd: (() => void) | null = null;
const isTransitioning = ref(false);
const reduceMotion = ref(false);

const isControlled = computed(() => props.modelValue !== undefined);
const isOpen = computed(() =>
  isControlled.value ? Boolean(props.modelValue) : uncontrolledOpen.value,
);

const setOpenState = (next: boolean) => {
  if (!isControlled.value) uncontrolledOpen.value = next;
  emit("update:modelValue", next);
  emit("toggle", next);
};

const open = () => {
  if (props.disabled || isOpen.value) return;
  setOpenState(true);
};

const close = () => {
  if (props.disabled || !isOpen.value) return;
  setOpenState(false);
};

const toggle = () => {
  if (props.disabled) return;
  setOpenState(!isOpen.value);
};

const stopCurrentTransition = () => {
  if (cleanupTransitionEnd) {
    cleanupTransitionEnd();
    cleanupTransitionEnd = null;
  }
};

const setTransitionStyle = (element: HTMLElement) => {
  element.style.transition = `height ${props.duration}ms ${props.easing}, opacity ${Math.round(props.duration * 0.85)}ms ${props.easing}`;
};

const expand = () => {
  const container = containerRef.value;
  const content = contentRef.value;
  if (!container || !content) return;

  stopCurrentTransition();
  isTransitioning.value = true;
  container.style.display = "block";

  if (reduceMotion.value) {
    container.style.transition = "none";
    container.style.height = "auto";
    container.style.opacity = "1";
    container.style.overflow = "visible";
    isTransitioning.value = false;
    emit("after-open");
    return;
  }

  const currentHeight = container.getBoundingClientRect().height;
  const targetHeight = content.scrollHeight;

  setTransitionStyle(container);
  container.style.overflow = "hidden";
  container.style.height = `${currentHeight}px`;
  container.style.opacity = "0";
  container.getBoundingClientRect();

  requestAnimationFrame(() => {
    container.style.height = `${targetHeight}px`;
    container.style.opacity = "1";
  });

  const onEnd = (event: TransitionEvent) => {
    if (event.propertyName !== "height") return;
    container.style.height = "auto";
    container.style.overflow = "visible";
    isTransitioning.value = false;
    emit("after-open");
    cleanupTransitionEnd = null;
    container.removeEventListener("transitionend", onEnd);
  };

  cleanupTransitionEnd = () => {
    container.removeEventListener("transitionend", onEnd);
    isTransitioning.value = false;
  };

  container.addEventListener("transitionend", onEnd);
};

const collapse = () => {
  const container = containerRef.value;
  const content = contentRef.value;
  if (!container || !content) return;

  stopCurrentTransition();
  isTransitioning.value = true;

  if (reduceMotion.value) {
    container.style.transition = "none";
    container.style.height = "0px";
    container.style.opacity = "0";
    container.style.overflow = "hidden";
    isTransitioning.value = false;
    emit("after-close");
    return;
  }

  const currentHeight =
    container.style.height === "auto"
      ? content.scrollHeight
      : container.getBoundingClientRect().height;

  setTransitionStyle(container);
  container.style.overflow = "hidden";
  container.style.height = `${currentHeight}px`;
  container.style.opacity = "1";
  container.getBoundingClientRect();

  requestAnimationFrame(() => {
    container.style.height = "0px";
    container.style.opacity = "0";
  });

  const onEnd = (event: TransitionEvent) => {
    if (event.propertyName !== "height") return;
    isTransitioning.value = false;
    emit("after-close");
    cleanupTransitionEnd = null;
    container.removeEventListener("transitionend", onEnd);
  };

  cleanupTransitionEnd = () => {
    container.removeEventListener("transitionend", onEnd);
    isTransitioning.value = false;
  };

  container.addEventListener("transitionend", onEnd);
};

const syncInitialState = () => {
  const container = containerRef.value;
  if (!container) return;
  container.style.transition = "none";
  container.style.overflow = isOpen.value ? "visible" : "hidden";
  container.style.opacity = isOpen.value ? "1" : "0";
  container.style.height = isOpen.value ? "auto" : "0px";
};

watch(
  () => isOpen.value,
  async (next) => {
    if (!import.meta.client) return;

    if (next && props.unmountOnClose) {
      await nextTick();
    }

    if (next) expand();
    else collapse();
  },
);

onMounted(() => {
  if (!import.meta.client) return;
  reduceMotion.value = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  syncInitialState();
});

onUnmounted(() => {
  stopCurrentTransition();
});

defineExpose({
  open,
  close,
  toggle,
  isOpen: readonly(isOpen),
  isTransitioning: readonly(isTransitioning),
});
</script>
