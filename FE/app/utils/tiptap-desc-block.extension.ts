import { Node } from "@tiptap/vue-3";

export type TDescBlockWidth = "full" | "half";

export type TDescBlockAttrs = {
  width: TDescBlockWidth;
  backgroundColor: string | null;
  borderRadius: string;
  padding: string;
};

export const DESC_BLOCK_RADIUS_OPTIONS = ["0", "4px", "8px", "12px", "16px", "24px"] as const;
export const DESC_BLOCK_PADDING_OPTIONS = ["0", "8px", "12px", "16px", "24px", "32px"] as const;

export const DEFAULT_DESC_BLOCK_ATTRS: TDescBlockAttrs = {
  width: "full",
  backgroundColor: "#f7f4f3",
  borderRadius: "8px",
  padding: "12px",
};

export const parseCssPx = (value: string | number | null | undefined, fallback = 0) => {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  const trimmed = value.trim();
  const pxMatch = trimmed.match(/^(\d+(?:\.\d+)?)px$/i);
  if (pxMatch) return Number(pxMatch[1]);
  const numeric = Number(trimmed.replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) ? numeric : fallback;
};

export const toCssPx = (value: string | number) => {
  const numeric = typeof value === "number" ? value : parseCssPx(value, 0);
  return `${Math.max(0, numeric)}px`;
};

export const buildDescBlockStyle = (attrs: Partial<TDescBlockAttrs>) => {
  const parts: string[] = ["min-width:0"];
  if (attrs.backgroundColor) {
    parts.push(`background-color:${attrs.backgroundColor}`);
  }
  if (attrs.borderRadius) {
    parts.push(`border-radius:${attrs.borderRadius}`);
  }
  if (attrs.padding) {
    parts.push(`padding:${attrs.padding}`);
  }
  if (attrs.width === "half") {
    parts.push("width:100%");
  }
  return parts.join(";");
};

const parseBlockWidth = (element: HTMLElement): TDescBlockWidth => {
  const width = element.getAttribute("data-width");
  if (width === "half") return "half";
  if (element.getAttribute("data-type") === "two-column-item") return "half";
  return "full";
};

const parseBlockBackground = (element: HTMLElement) =>
  element.getAttribute("data-bg") || element.style.backgroundColor || null;

const parseBlockRadius = (element: HTMLElement) =>
  element.getAttribute("data-radius") || element.style.borderRadius || DEFAULT_DESC_BLOCK_ATTRS.borderRadius;

const parseBlockPadding = (element: HTMLElement) =>
  element.getAttribute("data-padding") || element.style.padding || DEFAULT_DESC_BLOCK_ATTRS.padding;

export const DescBlock = Node.create({
  name: "descBlock",
  group: "block descBlock",
  content: "block+",
  defining: true,
  isolating: true,
  selectable: true,
  addAttributes() {
    return {
      width: {
        default: DEFAULT_DESC_BLOCK_ATTRS.width,
        parseHTML: (element: HTMLElement) => parseBlockWidth(element),
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-width": attributes.width,
        }),
      },
      backgroundColor: {
        default: DEFAULT_DESC_BLOCK_ATTRS.backgroundColor,
        parseHTML: (element: HTMLElement) => parseBlockBackground(element),
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.backgroundColor) return {};
          return { "data-bg": attributes.backgroundColor };
        },
      },
      borderRadius: {
        default: DEFAULT_DESC_BLOCK_ATTRS.borderRadius,
        parseHTML: (element: HTMLElement) => parseBlockRadius(element),
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-radius": attributes.borderRadius,
        }),
      },
      padding: {
        default: DEFAULT_DESC_BLOCK_ATTRS.padding,
        parseHTML: (element: HTMLElement) => parseBlockPadding(element),
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-padding": attributes.padding,
        }),
      },
    };
  },
  parseHTML() {
    return [
      { tag: 'div[data-type="desc-block"]' },
      { tag: 'div[data-type="two-column-item"]' },
    ];
  },
  renderHTML({ HTMLAttributes, node }: { HTMLAttributes: Record<string, unknown>; node: { attrs: TDescBlockAttrs } }) {
    const attrs = node.attrs;
    return [
      "div",
      {
        ...HTMLAttributes,
        "data-type": "desc-block",
        class: "desc-block",
        style: buildDescBlockStyle(attrs),
      },
      0,
    ];
  },
});

export const DescBlockRow = Node.create({
  name: "descBlockRow",
  group: "block",
  content: "descBlock{1,2}",
  defining: true,
  isolating: true,
  parseHTML() {
    return [
      { tag: 'div[data-type="desc-block-row"]' },
      { tag: 'div[data-type="two-column"]' },
    ];
  },
  renderHTML() {
    return [
      "div",
      {
        "data-type": "desc-block-row",
        class: "desc-block-row",
        style: "display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:8px 0;",
      },
      0,
    ];
  },
});

export const createDefaultDescBlockContent = (text = "Nội dung block...") => ({
  type: "descBlock",
  attrs: {
    ...DEFAULT_DESC_BLOCK_ATTRS,
    width: "full",
  },
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});

export const createHalfDescBlockContent = (text: string) => ({
  type: "descBlock",
  attrs: {
    ...DEFAULT_DESC_BLOCK_ATTRS,
    width: "half",
  },
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});
