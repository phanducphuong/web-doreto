<template>
  <div
    ref="wrapperRef"
    class="relative w-full group"
    @mouseenter="pause"
    @mouseleave="resume"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
  >
    <!-- Client slider -->
    <div
      ref="trackRef"
      class="flex overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x scrollbar-none gap-4"
      @scroll.passive="onScroll"
    >
      <div
        v-for="(item, i) in renderItems"
        :key="`slide-${i}`"
        class="shrink-0 snap-start"
        :style="{ width: slideWidth }"
      >
        <slot name="item" :item="item" :index="toRealIndex(i)" />
      </div>
    </div>

    <ClientOnly>
      <!-- Navigation arrows -->
      <button
        v-if="showNav"
        class="absolute left-2 top-1/2 -translate-y-1/2 z-2 size-9 rounded-full bg-white/90 border-base center-child cursor-pointer text-third-dark opacity-0 group-hover:opacity-100 hover:(bg-white text-primary border-primary) transition-all duration-200 touch-device:opacity-100"
        aria-label="Previous"
        @click="prev"
      >
        <ChevronLeft class="size-5" />
      </button>
      <button
        v-if="showNav"
        class="absolute right-2 top-1/2 -translate-y-1/2 z-2 size-9 rounded-full bg-white/90 border-base center-child cursor-pointer text-third-dark opacity-0 group-hover:opacity-100 hover:(bg-white text-primary border-primary) transition-all duration-200 touch-device:opacity-100"
        aria-label="Next"
        @click="next"
      >
        <ChevronRight class="size-5" />
      </button>

      <!-- Dots -->
      <div v-if="showDots" class="flex justify-center gap-1.5 pt-3">
        <button
          v-for="i in items.length"
          :key="i"
          :class="[
            'size-2 rounded-full border-none cursor-pointer transition-all duration-200',
            currentIndex === i - 1 ? 'bg-primary scale-125' : 'bg-third-light hover:bg-third-dark',
          ]"
          :aria-label="`Go to slide ${i}`"
          @click="goTo(i - 1)"
        />
      </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight } from "lucide-vue-next";

const {
  items,
  slidesPerView = 1,
  gap = 0,
  autoplay = 0,
  showNav = true,
  showDots = true,
} = defineProps<{
  items: any[];
  slidesPerView?: number;
  gap?: number;
  autoplay?: number;
  showNav?: boolean;
  showDots?: boolean;
}>();

const mounted = ref(false);
const trackRef = ref<HTMLElement | null>(null);
const wrapperRef = ref<HTMLElement | null>(null);
const currentIndex = ref(0);

const cloneCount = computed(() => slidesPerView);
const totalSlides = computed(() => items.length);

// Items: [clone tail...] + [real items] + [clone head...]
const renderItems = computed(() => {
  if (!items.length) return [];
  const head = items.slice(0, cloneCount.value);
  const tail = items.slice(-cloneCount.value);
  return [...tail, ...items, ...head];
});

const slideWidth = computed(() =>
  slidesPerView === 1 ? "100%" : `calc((100% - ${gap * (slidesPerView - 1)}px) / ${slidesPerView})`,
);

// The offset caused by cloned tail slides
const cloneOffset = computed(() => cloneCount.value);

// * SCROLL HELPERS
function getSlideScrollLeft(index: number) {
  const track = trackRef.value;
  if (!track) return 0;
  const child = track.children[index + cloneOffset.value] as HTMLElement | undefined;
  return child ? child.offsetLeft : 0;
}

function scrollToIndex(index: number, behavior: ScrollBehavior = "smooth") {
  const track = trackRef.value;
  if (!track) return;
  const target = track.children[index + cloneOffset.value] as HTMLElement | undefined;
  if (!target) return;
  track.scrollTo({ left: target.offsetLeft, behavior });
}

let isJumping = false;

function jumpIfNeeded() {
  const track = trackRef.value;
  if (!track || isJumping) return;

  const renderLen = renderItems.value.length;
  const rawIdx = getNearestSlideIndex();

  // Jumped past end clones → wrap to start
  if (rawIdx >= totalSlides.value + cloneOffset.value) {
    isJumping = true;
    const realIdx = rawIdx - totalSlides.value;
    const child = track.children[realIdx] as HTMLElement | undefined;
    if (child) track.scrollTo({ left: child.offsetLeft, behavior: "instant" });
    requestAnimationFrame(() => (isJumping = false));
    return;
  }

  // Jumped past start clones → wrap to end
  if (rawIdx < cloneOffset.value) {
    isJumping = true;
    const realIdx = rawIdx + totalSlides.value;
    const child = track.children[realIdx] as HTMLElement | undefined;
    if (child) track.scrollTo({ left: child.offsetLeft, behavior: "instant" });
    requestAnimationFrame(() => (isJumping = false));
    return;
  }
}

function getNearestSlideIndex(): number {
  const track = trackRef.value;
  if (!track) return cloneOffset.value;
  const scrollLeft = track.scrollLeft;
  let closest = 0;
  let minDist = Infinity;
  for (let i = 0; i < track.children.length; i++) {
    const child = track.children[i] as HTMLElement;
    const dist = Math.abs(child.offsetLeft - scrollLeft);
    if (dist < minDist) {
      minDist = dist;
      closest = i;
    }
  }
  return closest;
}

// * SCROLL EVENT
let scrollTimer: ReturnType<typeof setTimeout> | null = null;

function onScroll() {
  if (isJumping) return;
  if (scrollTimer) clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    jumpIfNeeded();
    updateCurrentIndex();
  }, 60);
}

function updateCurrentIndex() {
  const raw = getNearestSlideIndex();
  const real = raw - cloneOffset.value;
  currentIndex.value = ((real % totalSlides.value) + totalSlides.value) % totalSlides.value;
}

// * NAVIGATION
function next() {
  const raw = getNearestSlideIndex();
  const nextRaw = raw + 1;
  const track = trackRef.value;
  if (!track) return;
  const child = track.children[nextRaw] as HTMLElement | undefined;
  if (child) track.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
}

function prev() {
  const raw = getNearestSlideIndex();
  const prevRaw = raw - 1;
  const track = trackRef.value;
  if (!track) return;
  const child = track.children[prevRaw] as HTMLElement | undefined;
  if (child) track.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
}

function goTo(realIndex: number) {
  scrollToIndex(realIndex);
}

// Convert render index to real item index
function toRealIndex(renderIdx: number): number {
  const real = renderIdx - cloneOffset.value;
  return ((real % totalSlides.value) + totalSlides.value) % totalSlides.value;
}

// * AUTOPLAY
let autoplayTimer: ReturnType<typeof setInterval> | null = null;

function startAutoplay() {
  stopAutoplay();
  if (autoplay > 0) {
    autoplayTimer = setInterval(next, autoplay);
  }
}

function stopAutoplay() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
}

function pause() {
  stopAutoplay();
}

function resume() {
  startAutoplay();
}

// * TOUCH (mobile swipe feel is native via scroll-snap, but we pause autoplay)
let touchStartX = 0;

function onTouchStart(e: TouchEvent) {
  pause();
  touchStartX = e.touches[0]?.clientX ?? 0;
}

function onTouchEnd(e: TouchEvent) {
  resume();
}

// * LIFECYCLE
onMounted(() => {
  nextTick(() => {
    const track = trackRef.value;
    if (track) {
      const child = track.children[cloneOffset.value] as HTMLElement | undefined;
      if (child) track.scrollTo({ left: child.offsetLeft, behavior: "instant" });
    }
    startAutoplay();
  });
});

onBeforeUnmount(() => {
  stopAutoplay();
  if (scrollTimer) clearTimeout(scrollTimer);
});

defineExpose({ next, prev, goTo, currentIndex });
</script>
