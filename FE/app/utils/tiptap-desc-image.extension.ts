import Image from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/core";
import { parseCssPx } from "~/utils/tiptap-desc-block.extension";

export const IMAGE_SHADOW_PRESETS = {
  none: "",
  sm: "0 1px 3px rgba(0,0,0,0.12)",
  md: "0 4px 12px rgba(0,0,0,0.15)",
  lg: "0 8px 24px rgba(0,0,0,0.2)",
} as const;

export type TImageShadowPreset = keyof typeof IMAGE_SHADOW_PRESETS;

export type TDescImageAttrs = {
  src: string | null;
  alt?: string | null;
  title?: string | null;
  imageAlign: "left" | "center" | "right" | null;
  imageWidth: string | null;
  borderRadius: string | null;
  imageShadow: TImageShadowPreset | null;
};

const SHADOW_VALUES = new Set(Object.keys(IMAGE_SHADOW_PRESETS));

const parseShadowPreset = (value: string | null | undefined): TImageShadowPreset | null => {
  if (!value || value === "none") return null;
  if (SHADOW_VALUES.has(value)) return value as TImageShadowPreset;
  return null;
};

const parseWidthPercent = (element: HTMLElement) => {
  const dataWidth = element.getAttribute("data-width");
  if (dataWidth) return dataWidth;

  const width = element.style.width;
  if (width?.endsWith("%")) return width;

  return null;
};

export const buildDescImageStyle = (attrs: Partial<TDescImageAttrs>) => {
  const parts = ["display:block", "max-width:100%", "height:auto"];

  if (attrs.imageWidth) {
    parts.push(`width:${attrs.imageWidth}`);
  }

  if (attrs.borderRadius) {
    parts.push(`border-radius:${attrs.borderRadius}`);
  }

  const shadow =
    attrs.imageShadow && attrs.imageShadow !== "none"
      ? IMAGE_SHADOW_PRESETS[attrs.imageShadow]
      : "";
  if (shadow) {
    parts.push(`box-shadow:${shadow}`);
  }

  const align = attrs.imageAlign;
  if (align === "left") {
    parts.push("margin-right:auto", "margin-left:0");
  } else if (align === "right") {
    parts.push("margin-left:auto", "margin-right:0");
  } else if (align === "center") {
    parts.push("margin-left:auto", "margin-right:auto");
  }

  return parts.join(";");
};

const buildEditorImageStyle = (attrs: Partial<TDescImageAttrs>) => {
  const parts = ["display:block", "width:100%", "max-width:100%", "height:auto"];

  if (attrs.borderRadius) {
    parts.push(`border-radius:${attrs.borderRadius}`);
  }

  const shadow =
    attrs.imageShadow && attrs.imageShadow !== "none"
      ? IMAGE_SHADOW_PRESETS[attrs.imageShadow]
      : "";
  if (shadow) {
    parts.push(`box-shadow:${shadow}`);
  }

  return parts.join(";");
};

const applyWrapAttrs = (wrap: HTMLDivElement, attrs: Partial<TDescImageAttrs>) => {
  wrap.dataset.align = attrs.imageAlign || "center";
  wrap.style.width = attrs.imageWidth || "100%";
  wrap.style.maxWidth = "100%";
};

const applyEditorImageAttrs = (img: HTMLImageElement, attrs: Partial<TDescImageAttrs>) => {
  img.src = attrs.src || "";
  img.alt = attrs.alt || "";
  img.style.cssText = buildEditorImageStyle(attrs);

  if (attrs.imageWidth) {
    img.setAttribute("data-width", attrs.imageWidth);
  } else {
    img.removeAttribute("data-width");
  }

  if (attrs.imageShadow && attrs.imageShadow !== "none") {
    img.setAttribute("data-shadow", attrs.imageShadow);
  } else {
    img.removeAttribute("data-shadow");
  }

  if (attrs.borderRadius) {
    img.setAttribute("data-radius", attrs.borderRadius);
  } else {
    img.removeAttribute("data-radius");
  }
};

export const DescImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      imageAlign: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-align") || null,
        renderHTML: () => ({}),
      },
      imageWidth: {
        default: null,
        parseHTML: (element) => parseWidthPercent(element as HTMLElement),
        renderHTML: () => ({}),
      },
      borderRadius: {
        default: null,
        parseHTML: (element) =>
          (element as HTMLElement).getAttribute("data-radius") ||
          (element as HTMLElement).style.borderRadius ||
          null,
        renderHTML: () => ({}),
      },
      imageShadow: {
        default: null,
        parseHTML: (element) => parseShadowPreset((element as HTMLElement).getAttribute("data-shadow")),
        renderHTML: () => ({}),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = HTMLAttributes as TDescImageAttrs;
    const style = buildDescImageStyle(attrs);

    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        style,
        ...(attrs.imageAlign ? { "data-align": attrs.imageAlign } : {}),
        ...(attrs.imageWidth ? { "data-width": attrs.imageWidth } : {}),
        ...(attrs.borderRadius ? { "data-radius": attrs.borderRadius } : {}),
        ...(attrs.imageShadow && attrs.imageShadow !== "none"
          ? { "data-shadow": attrs.imageShadow }
          : {}),
      }),
    ];
  },

  addNodeView() {
    return ({ node }) => {
      let currentNode = node;

      const wrap = document.createElement("div");
      wrap.className = "desc-image-node-view";
      wrap.setAttribute("contenteditable", "false");
      wrap.draggable = false;

      const img = document.createElement("img");
      img.draggable = false;

      wrap.append(img);

      const render = () => {
        const attrs = currentNode.attrs as TDescImageAttrs;
        applyWrapAttrs(wrap, attrs);
        applyEditorImageAttrs(img, attrs);
      };

      render();

      return {
        dom: wrap,
        update: (updatedNode) => {
          if (updatedNode.type.name !== "image") return false;
          currentNode = updatedNode;
          render();
          return true;
        },
        ignoreMutation: () => true,
      };
    };
  },
});

export const parseImageWidthPercent = (value: string | null | undefined, fallback = 100) => {
  if (!value) return fallback;
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d+(?:\.\d+)?)%$/);
  if (match) return Number(match[1]);
  const px = parseCssPx(trimmed, fallback);
  return px;
};
