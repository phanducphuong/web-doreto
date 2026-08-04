<template>
  <section class="w-full flex flex-col">
    <div class="w-full">
      <h2 class="mb-3 font-semibold text-lg text-on-surface md:(mb-4 text-xl)">
        Giới thiệu về sản phẩm này
      </h2>
      <div class="relative">
        <div
          ref="contentRef"
          class="product-description relative text-base text-on-surface-variant overflow-hidden py-2"
          :class="{
            'max-h-[300vh] md:max-h-screen': visuallyCollapsed,
            'max-h-none': !visuallyCollapsed,
          }"
          v-html="optimizedDescription"
        />
        <div
          v-if="visuallyCollapsed && canCollapse"
          class="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-bg-body to-transparent"
          aria-hidden="true"
        />
      </div>
      <AtomsButton
        v-if="canCollapse"
        type="link"
        class="mx-auto mt-4 flex items-center gap-2 !text-lg font-bold text-primary md:!text-xl"
        @click="isShowFullDescription = !isShowFullDescription"
      >
        {{ isShowFullDescription ? "Rút gọn" : "Xem thêm chi tiết" }}
        <ChevronDown
          class="size-5 shrink-0 transition-transform duration-200 md:size-6"
          :class="isShowFullDescription ? 'rotate-180' : 'rotate-0'"
        />
      </AtomsButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ChevronDown } from "lucide-vue-next";
import type { TImageLightboxSlide } from "~/types/image-lightbox.type";
import type { TActiveImageFrame } from "~/types/image-frame.type";
import {
  applyFramesToDescriptionContainer,
  isDescriptionFramedPhoto,
  isDescriptionFrameImage,
  resolveFrameForImage,
  unwrapDescriptionFrames,
} from "~/utils/image-frame.utils";

const props = defineProps<{
  description: string;
  descriptionFrame?: TActiveImageFrame | null;
  activeFrames?: TActiveImageFrame[];
}>();

const { emitOpenImageLightbox } = useImageLightbox();
const contentRef = ref<HTMLElement | null>(null);

// Gắn lazy/preload ngay trong HTML trước khi render — nếu gắn sau khi parse thì
// trình duyệt đã bắt đầu tải hết ảnh/video rồi, quá muộn.
const optimizedDescription = computed(() =>
  (props.description || "")
    .replace(/<img\b(?![^>]*\bloading=)/gi, '<img loading="lazy" decoding="async" ')
    .replace(/<video\b(?![^>]*\bpreload=)/gi, '<video preload="metadata" '),
);
const isShowFullDescription = ref(false);
const canCollapse = ref(false);
const hasMeasured = ref(false);

const activeFramesMap = computed(() => {
  const map = new Map<number, TActiveImageFrame>();
  props.activeFrames?.forEach((frame) => map.set(frame._id, frame));
  if (props.descriptionFrame) {
    map.set(props.descriptionFrame._id, props.descriptionFrame);
  }
  return map;
});

const visuallyCollapsed = computed(
  () => !hasMeasured.value || (canCollapse.value && !isShowFullDescription.value),
);

function updateCanCollapse() {
  const el = contentRef.value;
  if (!el) {
    canCollapse.value = false;
    hasMeasured.value = true;
    return;
  }
  canCollapse.value = el.scrollHeight > el.clientHeight + 1;
  hasMeasured.value = true;
}

function measure() {
  hasMeasured.value = false;
  isShowFullDescription.value = false;
  nextTick(() => {
    updateCanCollapse();
  });
}

function applyDescriptionFrames() {
  const container = contentRef.value;
  if (!container) return;

  unwrapDescriptionFrames(container);
  applyFramesToDescriptionContainer(
    container,
    props.descriptionFrame,
    activeFramesMap.value.size ? activeFramesMap.value : undefined,
  );
}

function buildLightboxSlides(): TImageLightboxSlide[] {
  const container = contentRef.value;
  if (!container) return [];

  const figures = Array.from(container.querySelectorAll("figure.desc-framed-image"));
  if (figures.length) {
    return figures
      .map((figure) => {
        const photo = figure.querySelector("img.desc-framed-image__photo");
        if (!(photo instanceof HTMLImageElement)) return null;

        const src = photo.getAttribute("src");
        if (!src) return null;

        const frameId = Number(figure.getAttribute("data-frame-id"));
        const frame =
          (!Number.isNaN(frameId) && activeFramesMap.value.get(frameId)) ||
          props.descriptionFrame ||
          null;

        if (!frame) {
          return { kind: "image" as const, src };
        }

        return { kind: "framed" as const, src, frame };
      })
      .filter((slide): slide is TImageLightboxSlide => Boolean(slide));
  }

  return Array.from(container.querySelectorAll("img"))
    .filter((img) => !isDescriptionFrameImage(img))
    .map((img) => {
      const src = img.getAttribute("src");
      if (!src) return null;

      const frame = resolveFrameForImage(
        img,
        props.descriptionFrame,
        activeFramesMap.value.size ? activeFramesMap.value : undefined,
      );

      if (!frame) {
        return { kind: "image" as const, src };
      }

      return { kind: "framed" as const, src, frame };
    })
    .filter((slide): slide is TImageLightboxSlide => Boolean(slide));
}

let videoObserver: IntersectionObserver | null = null;

// * TẢI CHẬM ẢNH/VIDEO TRONG MÔ TẢ
// Nội dung mô tả là HTML từ CMS nên ảnh/video mặc định tải hết ngay khi vào trang.
// Gắn lazy để ảnh chỉ tải khi khách cuộn tới; video chỉ tải thông tin thời lượng,
// khi nào cuộn tới (tự phát) mới tải nội dung.
function optimizeDescriptionMedia() {
  const container = contentRef.value;
  if (!container) return;

  container.querySelectorAll("img").forEach((img) => {
    img.loading = "lazy";
    img.decoding = "async";
  });

  container.querySelectorAll("video").forEach((video) => {
    video.preload = "metadata";
  });
}

// * BỘ ĐIỀU KHIỂN VIDEO TỰ VẼ
// Bỏ controls mặc định của trình duyệt (iOS phủ màn đen mờ khó nhìn),
// thay bằng nút phát/tạm dừng + lùi/tua 10s + thời lượng, không có lớp phủ tối.
const ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M8 5v14l11-7z"/></svg>';
const ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
const ICON_BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>';
const ICON_FWD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>';

function formatVideoTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function enhanceVideoControls() {
  const container = contentRef.value;
  if (!container) return;

  container.querySelectorAll("video").forEach((video) => {
    if (video.dataset.customControls === "1") return;
    video.dataset.customControls = "1";
    video.removeAttribute("controls");

    // Bọc video để đặt nút điều khiển lên trên
    const wrapper = document.createElement("div");
    wrapper.className = "desc-video";
    video.parentNode?.insertBefore(wrapper, video);
    wrapper.appendChild(video);

    const controls = document.createElement("div");
    controls.className = "desc-video__controls";

    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "desc-video__btn";
    backBtn.setAttribute("aria-label", "Lùi 10 giây");
    backBtn.innerHTML = `${ICON_BACK}<span>10</span>`;

    const playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.className = "desc-video__btn desc-video__btn--play";
    playBtn.setAttribute("aria-label", "Phát / tạm dừng");
    playBtn.innerHTML = ICON_PLAY;

    const fwdBtn = document.createElement("button");
    fwdBtn.type = "button";
    fwdBtn.className = "desc-video__btn";
    fwdBtn.setAttribute("aria-label", "Tua 10 giây");
    fwdBtn.innerHTML = `<span>10</span>${ICON_FWD}`;

    controls.append(backBtn, playBtn, fwdBtn);

    const timeChip = document.createElement("div");
    timeChip.className = "desc-video__time";
    timeChip.textContent = "0:00 / 0:00";

    wrapper.append(controls, timeChip);

    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    const showControls = () => {
      wrapper.classList.remove("desc-video--idle");
      if (hideTimer) clearTimeout(hideTimer);
      // Đang phát thì tự ẩn nút sau 2.5s cho đỡ vướng
      if (!video.paused) {
        hideTimer = setTimeout(() => wrapper.classList.add("desc-video--idle"), 2500);
      }
    };

    const updateTime = () => {
      timeChip.textContent = `${formatVideoTime(video.currentTime)} / ${formatVideoTime(video.duration)}`;
    };

    const updatePlayIcon = () => {
      playBtn.innerHTML = video.paused ? ICON_PLAY : ICON_PAUSE;
    };

    playBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (video.paused) video.play().catch(() => {});
      else video.pause();
      showControls();
    });
    backBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      video.currentTime = Math.max(0, video.currentTime - 10);
      showControls();
    });
    fwdBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10);
      showControls();
    });

    // Chạm vào video: hiện/ẩn nút điều khiển
    wrapper.addEventListener("click", () => {
      if (wrapper.classList.contains("desc-video--idle")) showControls();
      else if (!video.paused) wrapper.classList.add("desc-video--idle");
    });

    video.addEventListener("play", () => {
      updatePlayIcon();
      showControls();
    });
    video.addEventListener("pause", () => {
      updatePlayIcon();
      showControls();
    });
    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateTime);
    updateTime();
    updatePlayIcon();
  });
}

function setupVideoAutoplay() {
  const container = contentRef.value;
  if (!container) return;

  videoObserver?.disconnect();
  const videos = Array.from(container.querySelectorAll("video"));
  if (!videos.length) return;

  videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement;
        // Phát khi thấy được >= 50% video, hoặc video (cao hơn màn hình)
        // đang chiếm >= nửa chiều cao màn hình
        const viewportHeight = entry.rootBounds?.height ?? window.innerHeight;
        const shouldPlay =
          entry.intersectionRatio >= 0.5 ||
          entry.intersectionRect.height >= viewportHeight / 2;
        if (shouldPlay) {
          // Trình duyệt chỉ cho tự phát khi video tắt tiếng
          video.muted = true;
          video.playsInline = true;
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] },
  );
  videos.forEach((video) => videoObserver?.observe(video));
}

const onDescriptionClick = (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof HTMLImageElement)) return;
  if (isDescriptionFrameImage(target)) return;

  const slides = buildLightboxSlides();
  if (!slides.length) return;

  let clickedSrc = target.getAttribute("src");
  if (isDescriptionFramedPhoto(target)) {
    clickedSrc = target.getAttribute("src");
  } else if (!clickedSrc) {
    return;
  }

  const index = slides.findIndex((slide) => slide.src === clickedSrc);
  emitOpenImageLightbox({ slides, index: index >= 0 ? index : 0 });
};

onMounted(() => {
  applyDescriptionFrames();
  measure();
  optimizeDescriptionMedia();
  enhanceVideoControls();
  setupVideoAutoplay();
  contentRef.value?.addEventListener("click", onDescriptionClick);
});

onBeforeUnmount(() => {
  videoObserver?.disconnect();
  videoObserver = null;
  contentRef.value?.removeEventListener("click", onDescriptionClick);
});

watch(
  () => [props.description, props.descriptionFrame, props.activeFrames] as const,
  () => {
    nextTick(() => {
      applyDescriptionFrames();
      measure();
      optimizeDescriptionMedia();
      enhanceVideoControls();
      setupVideoAutoplay();
    });
  },
  { deep: true },
);
</script>

<style scoped>
.product-description {
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
  /* Giãn dòng mặc định của mô tả — khớp với editor (TiptapEditor.vue) */
  line-height: 1.5;
}

.product-description :deep(*) {
  max-width: 100%;
}

.product-description :deep(strong),
.product-description :deep(b) {
  font-weight: 700;
}

.product-description :deep(s),
.product-description :deep(del),
.product-description :deep(strike) {
  text-decoration: line-through;
}

.product-description :deep(.desc-block-row),
.product-description :deep([data-type="desc-block-row"]),
.product-description :deep([data-type="two-column"]) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin: 8px 0;
}

.product-description :deep(.desc-block),
.product-description :deep([data-type="desc-block"]),
.product-description :deep([data-type="two-column-item"]) {
  min-width: 0;
  margin: 8px 0;
}

.product-description :deep(.desc-block-row .desc-block),
.product-description :deep([data-type="desc-block-row"] [data-type="desc-block"]),
.product-description :deep([data-type="two-column"] [data-type="two-column-item"]) {
  margin: 0;
}

.product-description :deep(p) {
  min-height: 1rem;
  margin: 0 0 0.75rem;
}

.product-description :deep(p:empty) {
  min-height: 1rem;
  display: block;
}

.product-description :deep(img),
.product-description :deep(video),
.product-description :deep(iframe),
.product-description :deep(table),
.product-description :deep(pre),
.product-description :deep(code) {
  max-width: 100%;
}

.product-description :deep(img:not(.desc-framed-image__frame)) {
  cursor: zoom-in;
}

/* Khoảng cách dọc mặc định giữa text và ảnh/video: ~1 dòng (chữ 16px);
   margin liền kề tự gộp nên 2 ảnh liên tiếp cũng cách nhau đúng 1 dòng */
.product-description :deep(img:not(.desc-framed-image__photo):not(.desc-framed-image__frame)),
.product-description :deep(.desc-framed-image) {
  margin-block: 20px;
}

.product-description :deep(video) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 20px auto;
  border-radius: 8px;
  background: #111827;
}

/* Bộ điều khiển video tự vẽ — không có lớp phủ tối */
.product-description :deep(.desc-video) {
  position: relative;
  margin: 20px auto;
  max-width: 100%;
  width: fit-content;
}

.product-description :deep(.desc-video video) {
  margin: 0 auto;
}

.product-description :deep(.desc-video__controls) {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 22px;
  pointer-events: none;
  opacity: 1;
  transition: opacity 0.25s ease;
}

.product-description :deep(.desc-video__btn) {
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: 42px;
  min-width: 42px;
  padding: 0 8px;
  border: none;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.product-description :deep(.desc-video__btn--play) {
  height: 54px;
  min-width: 54px;
}

.product-description :deep(.desc-video__time) {
  position: absolute;
  left: 8px;
  bottom: 8px;
  padding: 2px 8px;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  pointer-events: none;
  transition: opacity 0.25s ease;
}

.product-description :deep(.desc-video--idle .desc-video__controls),
.product-description :deep(.desc-video--idle .desc-video__time) {
  opacity: 0;
}

.product-description :deep(.desc-video--idle .desc-video__btn) {
  pointer-events: none;
}

.product-description :deep(table) {
  display: block;
  overflow-x: auto;
}

.product-description :deep(pre) {
  white-space: pre-wrap;
}
</style>
