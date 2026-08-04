import { mergeAttributes, Node } from "@tiptap/core";
import { parseCssPx, toCssPx } from "~/utils/tiptap-desc-block.extension";
import { parseImageWidthPercent } from "~/utils/tiptap-desc-image.extension";

export type TDescVideoAttrs = {
  src: string | null;
  videoAlign: "left" | "center" | "right" | null;
  videoWidth: string | null;
};

export const buildDescVideoStyle = (attrs: Partial<TDescVideoAttrs>) => {
  const parts = ["display:block", "max-width:100%", "height:auto"];

  if (attrs.videoWidth) {
    parts.push(`width:${attrs.videoWidth}`);
  }

  const align = attrs.videoAlign;
  if (align === "left") {
    parts.push("margin-right:auto", "margin-left:0");
  } else if (align === "right") {
    parts.push("margin-left:auto", "margin-right:0");
  } else if (align === "center") {
    parts.push("margin-left:auto", "margin-right:auto");
  }

  return parts.join(";");
};

const buildEditorVideoStyle = () => "display:block;width:100%;max-width:100%;height:auto";

const applyWrapAttrs = (wrap: HTMLDivElement, attrs: Partial<TDescVideoAttrs>) => {
  wrap.dataset.align = attrs.videoAlign || "center";
  wrap.style.width = attrs.videoWidth || "100%";
  wrap.style.maxWidth = "100%";
};

export const DescVideo = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: false,
  selectable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute("src"),
      },
      videoAlign: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-align") || null,
        renderHTML: () => ({}),
      },
      videoWidth: {
        default: null,
        parseHTML: (element) => {
          const dataWidth = element.getAttribute("data-width");
          if (dataWidth) return dataWidth;
          const width = (element as HTMLElement).style.width;
          return width?.endsWith("%") ? width : null;
        },
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "video[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = HTMLAttributes as TDescVideoAttrs;
    const style = buildDescVideoStyle(attrs);

    return [
      "video",
      mergeAttributes(HTMLAttributes, {
        src: attrs.src,
        controls: "true",
        playsinline: "true",
        preload: "metadata",
        style,
        ...(attrs.videoAlign ? { "data-align": attrs.videoAlign } : {}),
        ...(attrs.videoWidth ? { "data-width": attrs.videoWidth } : {}),
      }),
    ];
  },

  addNodeView() {
    return ({ node }) => {
      let currentNode = node;

      const wrap = document.createElement("div");
      wrap.className = "desc-video-node-view";
      wrap.setAttribute("contenteditable", "false");
      wrap.draggable = false;

      const video = document.createElement("video");
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.draggable = false;

      wrap.append(video);

      const render = () => {
        const attrs = currentNode.attrs as TDescVideoAttrs;
        video.src = attrs.src || "";
        video.style.cssText = buildEditorVideoStyle();
        applyWrapAttrs(wrap, attrs);
      };

      render();

      return {
        dom: wrap,
        update: (updatedNode) => {
          if (updatedNode.type.name !== "video") return false;
          currentNode = updatedNode;
          render();
          return true;
        },
        ignoreMutation: () => true,
      };
    };
  },
});

export const parseVideoWidthPercent = parseImageWidthPercent;
