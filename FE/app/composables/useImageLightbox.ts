import type PhotoSwipe from "photoswipe";
import type { TImageLightboxPayload, TImageLightboxSlide } from "~/types/image-lightbox.type";
import { buildFramedSlideHtml } from "~/utils/image-frame.utils";

let activeInstance: InstanceType<typeof PhotoSwipe> | null = null;
let isStyleLoaded = false;

async function ensureStyle() {
  if (isStyleLoaded || !import.meta.client) return;
  await import("photoswipe/style.css");
  isStyleLoaded = true;
}

function resolveSlideDimensions(src: string) {
  return new Promise<{ src: string; width: number; height: number }>((resolve) => {
    const image = new Image();
    image.onload = () => {
      resolve({
        src,
        width: image.naturalWidth || 1920,
        height: image.naturalHeight || 1080,
      });
    };
    image.onerror = () => {
      resolve({ src, width: 1920, height: 1080 });
    };
    image.src = src;
  });
}

function normalizeSlides(payload: TImageLightboxPayload): TImageLightboxSlide[] {
  if (payload.slides?.length) return payload.slides;
  return (payload.images || []).map((src) => ({ kind: "image" as const, src }));
}

export function useImageLightbox() {
  const { $event } = useNuxtApp();

  const openImageLightbox = async (payload: TImageLightboxPayload) => {
    if (!import.meta.client) return;

    const slides = normalizeSlides(payload).filter((slide) => Boolean(slide.src));
    if (!slides.length) return;

    const index = Math.min(Math.max(payload.index ?? 0, 0), slides.length - 1);

    await ensureStyle();
    const { default: PhotoSwipe } = await import("photoswipe");

    if (activeInstance) {
      activeInstance.destroy();
      activeInstance = null;
    }

    const dataSource = await Promise.all(
      slides.map(async (slide) => {
        if (slide.kind === "framed") {
          const dimensions = await resolveSlideDimensions(slide.src);
          return {
            html: buildFramedSlideHtml(slide.src, slide.frame),
            width: dimensions.width,
            height: dimensions.height,
          };
        }

        return resolveSlideDimensions(slide.src);
      }),
    );

    activeInstance = new PhotoSwipe({
      dataSource,
      index,
      wheelToZoom: true,
      bgOpacity: 0.92,
      padding: { top: 20, bottom: 40, left: 16, right: 16 },
      showHideAnimationType: "zoom",
    });

    activeInstance.on("destroy", () => {
      activeInstance = null;
    });

    activeInstance.init();
  };

  const emitOpenImageLightbox = (payload: TImageLightboxPayload) => {
    $event("image-lightbox:open", payload);
  };

  return {
    openImageLightbox,
    emitOpenImageLightbox,
  };
}
