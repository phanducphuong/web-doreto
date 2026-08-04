import type { TActiveImageFrame } from "~/types/image-frame.type";

export const DEFAULT_FRAME_INSET = 0;

export const FRAME_IMAGE_ACCEPT = ".png,.webp,.jpg,.jpeg";

export function normalizeFrameInsets(
  frame: Pick<TActiveImageFrame, "insetTop" | "insetRight" | "insetBottom" | "insetLeft">,
) {
  return {
    top: frame.insetTop ?? DEFAULT_FRAME_INSET,
    right: frame.insetRight ?? DEFAULT_FRAME_INSET,
    bottom: frame.insetBottom ?? DEFAULT_FRAME_INSET,
    left: frame.insetLeft ?? DEFAULT_FRAME_INSET,
  };
}

export function getFrameWrapPaddingStyle(
  frame: Pick<TActiveImageFrame, "insetTop" | "insetRight" | "insetBottom" | "insetLeft">,
) {
  const inset = normalizeFrameInsets(frame);
  return {
    padding: `${inset.top}% ${inset.right}% ${inset.bottom}% ${inset.left}%`,
  };
}

export function resolveFrameForImage(
  img: HTMLImageElement,
  defaultFrame: TActiveImageFrame | null | undefined,
  activeFrames?: Map<number, TActiveImageFrame>,
): TActiveImageFrame | null {
  const overrideRaw = img.getAttribute("data-frame-id");
  const overrideId = overrideRaw ? Number(overrideRaw) : null;

  if (overrideId != null && !Number.isNaN(overrideId)) {
    if (activeFrames?.has(overrideId)) return activeFrames.get(overrideId)!;
    if (defaultFrame?._id === overrideId) return defaultFrame;
    return null;
  }

  return defaultFrame ?? null;
}

export function isDescriptionFrameImage(img: HTMLImageElement) {
  return (
    img.classList.contains("desc-framed-image__frame") ||
    img.classList.contains("desc-framed-image__frame-sizer")
  );
}

export function isDescriptionFramedPhoto(img: HTMLImageElement) {
  return img.classList.contains("desc-framed-image__photo");
}

type TBuildFramedContentOptions = {
  photoSrc?: string;
  alt?: string;
  frame: TActiveImageFrame | null | undefined;
};

export function buildFramedImageContent(
  figure: HTMLElement,
  { photoSrc = "", alt = "", frame }: TBuildFramedContentOptions,
) {
  figure.innerHTML = "";

  if (!frame) {
    if (!photoSrc) return;
    const photo = document.createElement("img");
    photo.className = "desc-framed-image__photo";
    photo.src = photoSrc;
    photo.alt = alt;
    figure.appendChild(photo);
    return;
  }

  const wrap = document.createElement("div");
  wrap.className = "desc-framed-image__photo-wrap";
  wrap.style.padding = getFrameWrapPaddingStyle(frame).padding;

  const photo = document.createElement("img");
  photo.className = "desc-framed-image__photo";
  photo.src = photoSrc;
  photo.alt = alt;
  wrap.appendChild(photo);

  const frameImg = document.createElement("img");
  frameImg.className = "desc-framed-image__frame";
  frameImg.src = frame.imageUrl;
  frameImg.alt = "";
  frameImg.setAttribute("aria-hidden", "true");

  figure.appendChild(frameImg);
  figure.appendChild(wrap);
}

export function wrapImageWithFrame(img: HTMLImageElement, frame: TActiveImageFrame) {
  if (img.closest(".desc-framed-image")) return;

  const figure = document.createElement("figure");
  figure.className = "desc-framed-image";
  figure.setAttribute("data-frame-id", String(frame._id));

  buildFramedImageContent(figure, {
    photoSrc: img.getAttribute("src") || "",
    alt: img.getAttribute("alt") || "",
    frame,
  });

  const photo = figure.querySelector("img.desc-framed-image__photo");
  if (photo instanceof HTMLImageElement) {
    if (img.getAttribute("data-align")) {
      photo.setAttribute("data-align", img.getAttribute("data-align")!);
    }
    const imgStyle = img.getAttribute("style");
    if (imgStyle) photo.setAttribute("style", imgStyle);
  }

  img.replaceWith(figure);
}

export function applyFramesToDescriptionContainer(
  container: HTMLElement,
  defaultFrame: TActiveImageFrame | null | undefined,
  activeFrames?: Map<number, TActiveImageFrame>,
) {
  const images = Array.from(container.querySelectorAll("img")).filter(
    (img) => !isDescriptionFrameImage(img) && !isDescriptionFramedPhoto(img),
  );

  images.forEach((img) => {
    const frame = resolveFrameForImage(img, defaultFrame, activeFrames);
    if (!frame) return;
    wrapImageWithFrame(img, frame);
  });
}

export function unwrapDescriptionFrames(container: HTMLElement) {
  container.querySelectorAll("figure.desc-framed-image").forEach((figure) => {
    const photo = figure.querySelector("img.desc-framed-image__photo");
    if (!(photo instanceof HTMLImageElement)) {
      figure.remove();
      return;
    }

    const plainImg = document.createElement("img");
    plainImg.src = photo.src;
    plainImg.alt = photo.alt;
    const align = photo.getAttribute("data-align");
    if (align) plainImg.setAttribute("data-align", align);
    const style = photo.getAttribute("style");
    if (style) plainImg.setAttribute("style", style);
    const frameId = figure.getAttribute("data-frame-id");
    if (frameId) plainImg.setAttribute("data-frame-id", frameId);

    figure.replaceWith(plainImg);
  });
}

export function buildFramedSlideHtml(photoSrc: string, frame: TActiveImageFrame) {
  const wrapPadding = getFrameWrapPaddingStyle(frame);
  return `<div class="pswp-framed-slide">
    <figure class="desc-framed-image desc-framed-image--lightbox">
      <img class="desc-framed-image__frame" src="${frame.imageUrl}" alt="" aria-hidden="true" />
      <div class="desc-framed-image__photo-wrap" style="padding:${wrapPadding.padding}">
        <img class="desc-framed-image__photo" src="${photoSrc}" alt="" />
      </div>
    </figure>
  </div>`;
}
