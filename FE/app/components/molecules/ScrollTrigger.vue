<template>
  <div>
    <slot></slot>
    <div ref="pivotRef" class="h-1 w-full"></div>
  </div>
</template>

<script lang="ts" setup>
const { autoAddScrollEvent, pivotTriggerMargin } = defineProps({
  autoAddScrollEvent: {
    type: Boolean,
    default: true,
  },
  pivotTriggerMargin: {
    type: [Number, String],
    default: 0,
  },
});
const pivotRef = ref<HTMLDivElement | null>(null);
const scrollObserver = ref<IntersectionObserver | null>(null);
const emit = defineEmits(["scrollend"]);

// * METHODS
const loadObserver = () => {
  try {
    scrollObserver.value = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            emit("scrollend");
            destroyObserver();
          }
        });
      },
      {
        root: null,
        rootMargin: `${pivotTriggerMargin}px`,
        threshold: 0,
      },
    );

    scrollObserver.value.observe(pivotRef.value as Element);
  } catch (error) {
    console.error(error);
  }
};

const destroyObserver = () => {
  if (scrollObserver.value) {
    scrollObserver.value.disconnect();
    scrollObserver.value = null;
  }
};

// * HOOKS
onMounted(() => {
  if (autoAddScrollEvent) loadObserver();
});

// * EXPOSE
defineExpose({
  loadObserver,
  destroyObserver,
});
</script>
