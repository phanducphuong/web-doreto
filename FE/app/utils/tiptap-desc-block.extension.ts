import { Node } from "@tiptap/vue-3";

export type TDescBlockWidth = "full" | "half";

export type TDescBlockAlign = "left" | "center";

// Đổ bóng cho block (khớp bộ preset của ảnh để đồng nhất diện mạo).
export const DESC_BLOCK_SHADOW_PRESETS = {
  none: "",
  sm: "0 3px 8px rgba(0,0,0,0.22)",
  md: "0 10px 22px rgba(0,0,0,0.32), 0 4px 8px rgba(0,0,0,0.22)",
  lg: "0 20px 44px rgba(0,0,0,0.45), 0 8px 16px rgba(0,0,0,0.32)",
} as const;

export type TDescBlockShadow = keyof typeof DESC_BLOCK_SHADOW_PRESETS;

export type TDescBlockAttrs = {
  width: TDescBlockWidth;
  backgroundColor: string | null;
  borderRadius: string;
  padding: string;
  // Kích thước tùy chỉnh khi kéo tay cầm. null = theo mặc định (rộng: full/half; cao: tự động)
  blockWidth: string | null;
  minHeight: string | null;
  // Căn ngang block trong trang: "left" (mặc định) hoặc "center" (chỉ thấy rõ khi block hẹp hơn 100%)
  align: TDescBlockAlign;
  // Đổ bóng: "none" (mặc định) | sm | md | lg
  shadow: TDescBlockShadow;
};

const DESC_BLOCK_SHADOW_KEYS = new Set(Object.keys(DESC_BLOCK_SHADOW_PRESETS));

const parseBlockShadow = (element: HTMLElement): TDescBlockShadow => {
  const raw = element.getAttribute("data-shadow");
  return raw && DESC_BLOCK_SHADOW_KEYS.has(raw) ? (raw as TDescBlockShadow) : "none";
};

export const DESC_BLOCK_RADIUS_OPTIONS = ["0", "4px", "8px", "12px", "16px", "24px"] as const;
export const DESC_BLOCK_PADDING_OPTIONS = ["0", "8px", "12px", "16px", "24px", "32px"] as const;

export const DEFAULT_DESC_BLOCK_ATTRS: TDescBlockAttrs = {
  width: "full",
  // Mặc định nền gradient 2 màu (khớp định dạng buildGradientValue: "linear-gradient(<angle>deg, <from> 0%, <to> 100%)")
  backgroundColor: "linear-gradient(180deg, #f7f4f3 0%, #ece3dd 100%)",
  borderRadius: "8px",
  padding: "12px",
  blockWidth: null,
  minHeight: null,
  align: "left",
  shadow: "md",
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

// Màu nền của block có thể là màu đơn (hex) hoặc gradient 2 màu (linear-gradient(...)).
export type TDescBgGradient = { from: string; to: string; angle: number };

export const isGradientValue = (value?: string | null): boolean =>
  typeof value === "string" && value.trim().toLowerCase().startsWith("linear-gradient");

export const buildGradientValue = (g: TDescBgGradient): string =>
  `linear-gradient(${g.angle}deg, ${g.from} 0%, ${g.to} 100%)`;

// Tách chuỗi theo dấu phẩy cấp cao nhất (bỏ qua dấu phẩy nằm trong ngoặc, ví dụ rgba(0,0,0)).
const splitTopLevel = (input: string): string[] => {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of input) {
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
};

export const parseGradientValue = (value?: string | null): TDescBgGradient | null => {
  if (!isGradientValue(value)) return null;
  const inner = value!
    .trim()
    .replace(/^linear-gradient\s*\(/i, "")
    .replace(/\)\s*$/, "");
  const segs = splitTopLevel(inner);
  if (segs.length < 2) return null;

  let angle = 180;
  let stops = segs;
  const angleMatch = (segs[0] ?? "").match(/^(-?\d+(?:\.\d+)?)deg$/i);
  if (angleMatch) {
    angle = Number(angleMatch[1]);
    stops = segs.slice(1);
  }
  if (stops.length < 2) return null;

  // Mỗi stop có dạng "màu [vị trí%]" -> lấy token màu đầu tiên.
  const colorOf = (stop: string | undefined) => (stop ?? "").split(/\s+/)[0] || "#ffffff";
  return { from: colorOf(stops[0]), to: colorOf(stops[stops.length - 1]), angle };
};

export const buildDescBlockStyle = (attrs: Partial<TDescBlockAttrs>) => {
  const parts: string[] = ["min-width:0"];
  if (attrs.backgroundColor) {
    // Gradient dùng shorthand `background`; màu đơn giữ `background-color` như cũ.
    if (isGradientValue(attrs.backgroundColor)) {
      parts.push(`background:${attrs.backgroundColor}`);
    } else {
      parts.push(`background-color:${attrs.backgroundColor}`);
    }
  }
  if (attrs.borderRadius) {
    parts.push(`border-radius:${attrs.borderRadius}`);
  }
  if (attrs.padding) {
    parts.push(`padding:${attrs.padding}`);
  }
  // Chiều rộng: ưu tiên giá trị kéo tay; nếu không có thì block half chiếm 100% cột
  if (attrs.blockWidth) {
    parts.push(`width:${attrs.blockWidth}`);
    parts.push("max-width:100%");
  } else if (attrs.width === "half") {
    parts.push("width:100%");
  }
  if (attrs.minHeight) {
    parts.push(`min-height:${attrs.minHeight}`);
  }
  // Căn giữa block: đẩy margin ngang về auto (chỉ có hiệu lực khi block hẹp hơn khung).
  if (attrs.align === "center") {
    parts.push("margin-left:auto");
    parts.push("margin-right:auto");
  }
  if (attrs.shadow && attrs.shadow !== "none") {
    parts.push(`box-shadow:${DESC_BLOCK_SHADOW_PRESETS[attrs.shadow]}`);
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

const parseBlockCustomWidth = (element: HTMLElement) =>
  element.getAttribute("data-block-width") || null;

const parseBlockMinHeight = (element: HTMLElement) =>
  element.getAttribute("data-min-height") || null;

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
      blockWidth: {
        default: DEFAULT_DESC_BLOCK_ATTRS.blockWidth,
        parseHTML: (element: HTMLElement) => parseBlockCustomWidth(element),
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.blockWidth) return {};
          return { "data-block-width": attributes.blockWidth };
        },
      },
      minHeight: {
        default: DEFAULT_DESC_BLOCK_ATTRS.minHeight,
        parseHTML: (element: HTMLElement) => parseBlockMinHeight(element),
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.minHeight) return {};
          return { "data-min-height": attributes.minHeight };
        },
      },
      align: {
        default: DEFAULT_DESC_BLOCK_ATTRS.align,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-align") === "center" ? "center" : "left",
        renderHTML: (attributes: Record<string, unknown>) => {
          if (attributes.align !== "center") return {};
          return { "data-align": "center" };
        },
      },
      shadow: {
        default: DEFAULT_DESC_BLOCK_ATTRS.shadow,
        parseHTML: (element: HTMLElement) => parseBlockShadow(element),
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.shadow || attributes.shadow === "none") return {};
          return { "data-shadow": attributes.shadow };
        },
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
  // NodeView: hiển thị block trong lúc soạn + tay cầm kéo đổi kích thước (từng chiều)
  addNodeView(): any {
    return ({ node, editor, getPos }: any) => {
      let currentNode = node;

      const dom = document.createElement("div");
      dom.className = "desc-block desc-block-node-view";
      dom.setAttribute("data-type", "desc-block");

      const content = document.createElement("div");
      content.className = "desc-block-content";
      dom.append(content);

      const applyStyle = () => {
        const attrs = currentNode.attrs as TDescBlockAttrs;
        dom.dataset.width = attrs.width;
        dom.style.cssText = `${buildDescBlockStyle(attrs)};position:relative`;
      };
      applyStyle();

      const commit = (patch: Partial<TDescBlockAttrs>) => {
        editor
          .chain()
          .command(({ tr, state }: any) => {
            const pos = typeof getPos === "function" ? getPos() : null;
            if (typeof pos !== "number") return false;
            const target = state.doc.nodeAt(pos);
            if (!target || target.type.name !== "descBlock") return false;
            tr.setNodeMarkup(pos, undefined, { ...target.attrs, ...patch });
            return true;
          })
          .run();
      };

      // Tay cầm: e = cạnh phải (rộng), s = cạnh dưới (cao), se = góc (cả hai)
      type THandle = { pos: "e" | "s" | "se"; dirX: number; dirY: number };
      const HANDLES: THandle[] = [
        { pos: "e", dirX: 1, dirY: 0 },
        { pos: "s", dirX: 0, dirY: 1 },
        { pos: "se", dirX: 1, dirY: 1 },
      ];

      let resizing = false;
      let active: THandle | null = null;
      let activeHandleEl: HTMLElement | null = null;
      let activePointerId = 0;
      let startX = 0;
      let startY = 0;
      let startW = 0;
      let startH = 0;
      let containerW = 0;
      let liveWidthPct = 100;
      let liveHeightPx = 0;

      // % chiều rộng hiện tại của block (mặc định 100 khi chưa đặt)
      const currentWidthPct = () => {
        const raw = currentNode.attrs.blockWidth;
        if (typeof raw === "string") {
          const m = raw.trim().match(/^(\d+(?:\.\d+)?)%$/);
          if (m) return Math.min(100, Math.max(10, Number(m[1])));
        }
        return 100;
      };

      const onMove = (event: PointerEvent) => {
        if (!resizing || !active) return;
        if (active.dirX !== 0 && containerW > 0) {
          const wpx = Math.max(40, startW + active.dirX * (event.clientX - startX));
          liveWidthPct = Math.min(100, Math.max(10, Math.round((wpx / containerW) * 1000) / 10));
          dom.style.width = `${liveWidthPct}%`;
          dom.style.maxWidth = "100%";
        }
        if (active.dirY !== 0) {
          liveHeightPx = Math.max(40, Math.round(startH + active.dirY * (event.clientY - startY)));
          dom.style.minHeight = `${liveHeightPx}px`;
        }
      };

      const onUp = () => {
        if (!resizing) return;
        resizing = false;
        const dir = active;
        active = null;
        if (activeHandleEl) {
          try {
            activeHandleEl.releasePointerCapture(activePointerId);
          } catch {
            /* bỏ qua nếu pointer đã nhả */
          }
          activeHandleEl = null;
        }
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        const patch: Partial<TDescBlockAttrs> = {};
        if (dir && dir.dirX !== 0) patch.blockWidth = `${liveWidthPct}%`;
        if (dir && dir.dirY !== 0) patch.minHeight = `${liveHeightPx}px`;
        commit(patch);
      };

      for (const def of HANDLES) {
        const handle = document.createElement("span");
        handle.className = `desc-block-handle desc-block-handle--${def.pos}`;
        handle.setAttribute("contenteditable", "false");
        handle.addEventListener("pointerdown", (event: PointerEvent) => {
          event.preventDefault();
          event.stopPropagation();
          resizing = true;
          active = def;
          activeHandleEl = handle;
          activePointerId = event.pointerId;
          try {
            handle.setPointerCapture(event.pointerId);
          } catch {
            /* một số trình duyệt có thể ném lỗi, bỏ qua */
          }
          startX = event.clientX;
          startY = event.clientY;
          const rect = dom.getBoundingClientRect();
          startW = rect.width;
          startH = rect.height;
          // Suy chiều rộng vùng chứa từ ĐÚNG % hiện tại -> tại điểm bắt đầu (delta=0)
          // width không đổi, không bị "nhảy nhỏ".
          const curPct = currentWidthPct();
          containerW = startW / (curPct / 100);
          liveWidthPct = curPct;
          liveHeightPx = Math.round(startH);
          window.addEventListener("pointermove", onMove);
          window.addEventListener("pointerup", onUp);
        });
        dom.append(handle);
      }

      return {
        dom,
        contentDOM: content,
        update: (updated: any) => {
          if (updated.type.name !== "descBlock") return false;
          currentNode = updated;
          applyStyle();
          return true;
        },
        ignoreMutation: (mutation: MutationRecord) => {
          if ((mutation as unknown as { type: string }).type === "selection") return false;
          return !content.contains(mutation.target);
        },
      };
    };
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
