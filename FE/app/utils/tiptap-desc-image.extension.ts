import Image from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/core";
import { parseCssPx } from "~/utils/tiptap-desc-block.extension";

export const IMAGE_SHADOW_PRESETS = {
  none: "",
  sm: "0 3px 8px rgba(0,0,0,0.22)",
  md: "0 10px 22px rgba(0,0,0,0.32), 0 4px 8px rgba(0,0,0,0.22)",
  lg: "0 20px 44px rgba(0,0,0,0.45), 0 8px 16px rgba(0,0,0,0.32)",
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
  // Mô hình "khung riêng – ảnh nằm trong". Tất cả bằng CSS thuần (object-fit cover
  // + object-position + width/height theo % zoom) nên KHỚP giữa editor và shop.
  frameRatio: number | null; // cao/rộng của khung (độc lập tỉ lệ ảnh). null = chưa cắt
  zoom: number | null; // >=1, phóng ảnh trong khung
  objPosX: number | null; // 0..100, vị trí ảnh trong khung (ngang)
  objPosY: number | null; // 0..100, vị trí ảnh trong khung (dọc)
};

const MAX_ZOOM = 4;

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

const parseNum = (raw: string | null, fallback: number | null): number | null => {
  if (raw == null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Đang ở chế độ "đã cắt khung" (khung có tỉ lệ riêng). */
export const isCropFrame = (attrs: Partial<TDescImageAttrs>) =>
  attrs.frameRatio != null && Number(attrs.frameRatio) > 0;

const getZoom = (attrs: Partial<TDescImageAttrs>) => {
  const z = Number(attrs.zoom);
  return Number.isFinite(z) && z >= 1 ? Math.min(MAX_ZOOM, z) : 1;
};
const getPosX = (attrs: Partial<TDescImageAttrs>) =>
  Number.isFinite(Number(attrs.objPosX)) ? clamp(Number(attrs.objPosX), 0, 100) : 50;
const getPosY = (attrs: Partial<TDescImageAttrs>) =>
  Number.isFinite(Number(attrs.objPosY)) ? clamp(Number(attrs.objPosY), 0, 100) : 50;

const shadowValue = (attrs: Partial<TDescImageAttrs>) =>
  attrs.imageShadow && attrs.imageShadow !== "none" ? IMAGE_SHADOW_PRESETS[attrs.imageShadow] : "";

const alignParts = (attrs: Partial<TDescImageAttrs>): string[] => {
  const align = attrs.imageAlign;
  if (align === "left") return ["margin-right:auto", "margin-left:0"];
  if (align === "right") return ["margin-left:auto", "margin-right:0"];
  if (align === "center") return ["margin-left:auto", "margin-right:auto"];
  return [];
};

// ==== Chế độ ảnh nguyên bản (chưa cắt khung) ====
export const buildDescImageStyle = (attrs: Partial<TDescImageAttrs>) => {
  const parts = ["display:block", "max-width:100%", "height:auto"];
  if (attrs.imageWidth) parts.push(`width:${attrs.imageWidth}`);
  if (attrs.borderRadius) parts.push(`border-radius:${attrs.borderRadius}`);
  const shadow = shadowValue(attrs);
  if (shadow) parts.push(`box-shadow:${shadow}`);
  parts.push(...alignParts(attrs));
  return parts.join(";");
};

// ==== Chế độ đã cắt khung: KHUNG (div) + ẢNH cover (pan/zoom bằng CSS) ====
const buildFrameStyle = (attrs: Partial<TDescImageAttrs>) => {
  const parts = [
    "display:block",
    "position:relative",
    "overflow:hidden",
    "max-width:100%",
    `width:${attrs.imageWidth || "100%"}`,
    `aspect-ratio:1 / ${Number(attrs.frameRatio)}`,
  ];
  if (attrs.borderRadius) parts.push(`border-radius:${attrs.borderRadius}`);
  const shadow = shadowValue(attrs);
  if (shadow) parts.push(`box-shadow:${shadow}`);
  parts.push(...alignParts(attrs));
  return parts.join(";");
};

// Ảnh cover: hộp = (zoom×khung) căn giữa, object-fit cover, object-position để dời.
const buildCoverImgStyle = (attrs: Partial<TDescImageAttrs>) => {
  const zoom = getZoom(attrs);
  const opx = getPosX(attrs);
  const opy = getPosY(attrs);
  // Hộp ảnh = zoom×khung. object-fit cover xử lý dư do lệch tỉ lệ (object-position),
  // còn phần dư do ZOOM thì dịch bằng left/top theo CÙNG opx/opy -> tổng dịch đúng
  // = -(kích thước ảnh - khung)*pos/100, nên kéo được kể cả khi khung trùng tỉ lệ ảnh.
  return [
    "position:absolute",
    `width:${100 * zoom}%`,
    `height:${100 * zoom}%`,
    // BẮT BUỘC: gỡ max-width/max-height 100% (rule chung của editor kẹp ảnh về 100%)
    // -> khi zoom>1 (width/height = 100*zoom%) sẽ bị kẹp width, méo ảnh & văng khỏi khung.
    "max-width:none",
    "max-height:none",
    `left:${-(zoom - 1) * opx}%`,
    `top:${-(zoom - 1) * opy}%`,
    "object-fit:cover",
    `object-position:${opx}% ${opy}%`,
  ].join(";");
};

const imageDataAttrs = (attrs: Partial<TDescImageAttrs>) => ({
  ...(attrs.imageAlign ? { "data-align": attrs.imageAlign } : {}),
  ...(attrs.imageWidth ? { "data-width": attrs.imageWidth } : {}),
  ...(attrs.borderRadius ? { "data-radius": attrs.borderRadius } : {}),
  ...(attrs.imageShadow && attrs.imageShadow !== "none" ? { "data-shadow": attrs.imageShadow } : {}),
  ...(isCropFrame(attrs)
    ? {
        "data-frame-ratio": String(attrs.frameRatio),
        "data-zoom": String(getZoom(attrs)),
        "data-pos-x": String(getPosX(attrs)),
        "data-pos-y": String(getPosY(attrs)),
      }
    : {}),
});

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
        default: "10px",
        parseHTML: (element) =>
          (element as HTMLElement).getAttribute("data-radius") ||
          (element as HTMLElement).style.borderRadius ||
          "10px",
        renderHTML: () => ({}),
      },
      imageShadow: {
        // Mặc định "md" chỉ áp cho ảnh MỚI chèn. Ảnh cũ (không có data-shadow) parse ra
        // "none" cụ thể -> KHÔNG bị default ghi đè thành md, và lựa chọn "Không" vẫn lưu được.
        default: "md",
        parseHTML: (element) =>
          parseShadowPreset((element as HTMLElement).getAttribute("data-shadow")) ?? "none",
        renderHTML: () => ({}),
      },
      frameRatio: {
        default: null,
        parseHTML: (element) => parseNum((element as HTMLElement).getAttribute("data-frame-ratio"), null),
        renderHTML: () => ({}),
      },
      zoom: {
        default: null,
        parseHTML: (element) => parseNum((element as HTMLElement).getAttribute("data-zoom"), null),
        renderHTML: () => ({}),
      },
      objPosX: {
        default: null,
        parseHTML: (element) => parseNum((element as HTMLElement).getAttribute("data-pos-x"), null),
        renderHTML: () => ({}),
      },
      objPosY: {
        default: null,
        parseHTML: (element) => parseNum((element as HTMLElement).getAttribute("data-pos-y"), null),
        renderHTML: () => ({}),
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    // Đọc thuộc tính tùy biến từ node.attrs (HTMLAttributes KHÔNG chứa chúng vì
    // per-attr renderHTML trả {}). Trước đây đọc nhầm HTMLAttributes -> mất crop khi lưu.
    const attrs = node.attrs as TDescImageAttrs;

    if (isCropFrame(attrs)) {
      return [
        "div",
        { class: "desc-image-frame", style: buildFrameStyle(attrs) },
        [
          "img",
          mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
            class: "desc-image-frame__img",
            style: buildCoverImgStyle(attrs),
            ...imageDataAttrs(attrs),
          }),
        ],
      ];
    }

    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        style: buildDescImageStyle(attrs),
        ...imageDataAttrs(attrs),
      }),
    ];
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      let currentNode = node;

      const wrap = document.createElement("div");
      wrap.className = "desc-image-node-view";
      wrap.setAttribute("contenteditable", "false");
      wrap.draggable = false;

      const frame = document.createElement("div");
      frame.className = "desc-image-frame-editor";
      const img = document.createElement("img");
      img.draggable = false;
      frame.append(img);
      wrap.append(frame);

      const attrsOf = () => currentNode.attrs as TDescImageAttrs;

      const applyWrapStyle = (attrs: TDescImageAttrs) => {
        wrap.dataset.align = attrs.imageAlign || "center";
        wrap.dataset.crop = isCropFrame(attrs) ? "1" : "0";
        wrap.style.cssText = [
          "display:block",
          "position:relative",
          "max-width:100%",
          `width:${attrs.imageWidth || "100%"}`,
          ...alignParts(attrs),
        ].join(";");
      };

      const render = () => {
        const attrs = attrsOf();
        img.src = attrs.src || "";
        img.alt = attrs.alt || "";
        applyWrapStyle(attrs);

        if (isCropFrame(attrs)) {
          frame.style.cssText = [
            "position:relative",
            "width:100%",
            "overflow:hidden",
            `aspect-ratio:1 / ${Number(attrs.frameRatio)}`,
            ...(attrs.borderRadius ? [`border-radius:${attrs.borderRadius}`] : []),
            ...(shadowValue(attrs) ? [`box-shadow:${shadowValue(attrs)}`] : []),
          ].join(";");
          img.className = "desc-image-frame__img";
          img.style.cssText = buildCoverImgStyle(attrs);
        } else {
          frame.style.cssText = "display:block;width:100%;line-height:0";
          const shadow = shadowValue(attrs);
          img.className = "";
          img.style.cssText = [
            "display:block",
            "width:100%",
            "max-width:100%",
            "height:auto",
            ...(attrs.borderRadius ? [`border-radius:${attrs.borderRadius}`] : []),
            ...(shadow ? [`box-shadow:${shadow}`] : []),
          ].join(";");
        }
      };

      const commit = (patch: Partial<TDescImageAttrs>) => {
        const pos = typeof getPos === "function" ? getPos() : undefined;
        if (typeof pos === "number") {
          editor.chain().setNodeSelection(pos).updateAttributes("image", patch).run();
        }
      };

      const clampPercent = (v: number) => Math.min(100, Math.max(10, Math.round(v * 100) / 100));

      // ================= KÉO ĐỔI KÍCH THƯỚC KHUNG (8 tay cầm) =================
      type TResizeHandle = { pos: string; cursor: string; dirX: number; dirY: number };
      const HANDLES: TResizeHandle[] = [
        { pos: "n", cursor: "ns-resize", dirX: 0, dirY: -1 },
        { pos: "s", cursor: "ns-resize", dirX: 0, dirY: 1 },
        { pos: "e", cursor: "ew-resize", dirX: 1, dirY: 0 },
        { pos: "w", cursor: "ew-resize", dirX: -1, dirY: 0 },
        { pos: "ne", cursor: "nesw-resize", dirX: 1, dirY: -1 },
        { pos: "se", cursor: "nwse-resize", dirX: 1, dirY: 1 },
        { pos: "sw", cursor: "nesw-resize", dirX: -1, dirY: 1 },
        { pos: "nw", cursor: "nwse-resize", dirX: -1, dirY: -1 },
      ];

      let resizing = false;
      let activeHandle: TResizeHandle | null = null;
      let startX = 0;
      let startY = 0;
      let startW = 0;
      let startH = 0;
      let containerWidth = 0;
      let liveWidthPercent = 100;
      let liveRatio = 1;

      const onResizeMove = (event: PointerEvent) => {
        if (!resizing || !activeHandle || containerWidth <= 0) return;
        const targetWpx =
          activeHandle.dirX !== 0
            ? Math.max(20, startW + activeHandle.dirX * (event.clientX - startX))
            : startW;
        const targetHpx =
          activeHandle.dirY !== 0
            ? Math.max(20, startH + activeHandle.dirY * (event.clientY - startY))
            : startH;
        liveWidthPercent = clampPercent((targetWpx / containerWidth) * 100);
        const renderedWpx = (liveWidthPercent / 100) * containerWidth;
        liveRatio = targetHpx / Math.max(1, renderedWpx);
        wrap.style.width = `${liveWidthPercent}%`;
        frame.style.width = "100%";
        frame.style.position = "relative";
        frame.style.overflow = "hidden";
        frame.style.aspectRatio = `1 / ${liveRatio}`;
        img.className = "desc-image-frame__img";
        img.style.cssText = buildCoverImgStyle(attrsOf());
      };

      const onResizeUp = () => {
        if (!resizing) return;
        resizing = false;
        activeHandle = null;
        window.removeEventListener("pointermove", onResizeMove);
        window.removeEventListener("pointerup", onResizeUp);
        const attrs = attrsOf();
        commit({
          imageWidth: `${liveWidthPercent}%`,
          frameRatio: Number(liveRatio.toFixed(4)),
          zoom: getZoom(attrs),
          objPosX: getPosX(attrs),
          objPosY: getPosY(attrs),
        });
      };

      for (const handleDef of HANDLES) {
        const handle = document.createElement("span");
        handle.className = `desc-image-handle desc-image-handle--${handleDef.pos}`;
        handle.style.cursor = handleDef.cursor;
        handle.setAttribute("contenteditable", "false");
        handle.addEventListener("pointerdown", (event: PointerEvent) => {
          event.preventDefault();
          event.stopPropagation();
          resizing = true;
          activeHandle = handleDef;
          startX = event.clientX;
          startY = event.clientY;
          const rect = frame.getBoundingClientRect();
          startW = rect.width;
          startH = rect.height;
          const curPct = Math.max(1, parseImageWidthPercent(attrsOf().imageWidth, 100));
          containerWidth = startW / (curPct / 100);
          window.addEventListener("pointermove", onResizeMove);
          window.addEventListener("pointerup", onResizeUp);
        });
        wrap.append(handle);
      }

      // ================= CẮT ẢNH TẠI CHỖ (bấm nút "Cắt ảnh" trên thanh) =================
      // Phóng khung to, hiện FULL ảnh, ngoài khung mờ; kéo ảnh + thanh zoom để căn.
      // Toán ánh xạ suy đúng theo CSS cover nên khớp tuyệt đối editor <-> shop.
      const overlay = document.createElement("div");
      overlay.className = "desc-image-crop-overlay";
      const zoomBar = document.createElement("input");
      zoomBar.type = "range";
      zoomBar.min = "1";
      zoomBar.max = String(MAX_ZOOM);
      zoomBar.step = "0.01";
      zoomBar.className = "desc-image-zoom-bar";
      const doneBtn = document.createElement("button");
      doneBtn.type = "button";
      doneBtn.className = "desc-image-crop-done";
      doneBtn.innerHTML =
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg><span>Xong cắt ảnh</span>';

      // Báo cho component cha biết đang cắt/đã xong (để ẩn thanh công cụ ảnh nổi, tránh đè nút)
      const emitCropEditing = (editing: boolean) => {
        wrap.dispatchEvent(
          new CustomEvent("desc-image-crop-editing", { bubbles: true, detail: { editing } }),
        );
      };

      let cropping = false;
      let origWidth = "";
      let cropFW = 1;
      let cropFH = 1;
      let baseCover = 1;
      let natW = 1;
      let natH = 1;
      let cZoom = 1;
      let cPosX = 50;
      let cPosY = 50;

      const dispW = () => cZoom * baseCover * natW;
      const dispH = () => cZoom * baseCover * natH;

      const layoutCrop = () => {
        // Khoảng dịch = (kích thước ảnh phóng - kích thước khung). pos 0..100: 0=sát mép
        // đầu, 50=giữa, 100=sát mép cuối. Khớp đúng CSS cover ở buildCoverImgStyle.
        const left = -(dispW() - cropFW) * (cPosX / 100);
        const top = -(dispH() - cropFH) * (cPosY / 100);
        img.style.cssText = [
          "position:absolute",
          `width:${dispW()}px`,
          `height:${dispH()}px`,
          `left:${left}px`,
          `top:${top}px`,
          "max-width:none",
          "object-fit:fill",
          "cursor:move",
        ].join(";");
        overlay.style.width = `${cropFW}px`;
        overlay.style.height = `${cropFH}px`;
      };

      const enterCrop = () => {
        if (cropping) return;
        natW = img.naturalWidth || 1;
        natH = img.naturalHeight || 1;
        // Ảnh CHƯA có khung -> tự tạo khung = đúng tỉ lệ ảnh (hiện full, chưa cắt gì)
        if (!isCropFrame(attrsOf())) {
          commit({
            frameRatio: Number((natH / natW).toFixed(4)),
            zoom: 1,
            objPosX: 50,
            objPosY: 50,
          });
        }
        const attrs = attrsOf();
        cropping = true;
        wrap.dataset.cropEditing = "1";
        // Phóng khung to bằng bề ngang vùng soạn cho dễ căn (giá trị lưu không đổi)
        origWidth = wrap.style.width;
        wrap.style.width = "100%";
        const rect = frame.getBoundingClientRect();
        cropFW = rect.width || 1;
        cropFH = rect.height || 1;
        baseCover = Math.max(cropFW / natW, cropFH / natH);
        cZoom = getZoom(attrs);
        cPosX = getPosX(attrs);
        cPosY = getPosY(attrs);
        frame.style.overflow = "visible";
        layoutCrop();
        frame.append(overlay);
        zoomBar.value = String(cZoom);
        wrap.append(zoomBar);
        wrap.append(doneBtn);
        emitCropEditing(true);
      };

      const exitCrop = (save: boolean) => {
        if (!cropping) return;
        cropping = false;
        emitCropEditing(false);
        delete wrap.dataset.cropEditing;
        overlay.remove();
        zoomBar.remove();
        doneBtn.remove();
        wrap.style.width = origWidth;
        if (save) commit({ zoom: cZoom, objPosX: Math.round(cPosX), objPosY: Math.round(cPosY) });
        // LUÔN render lại để khôi phục khung (overflow:hidden) + ảnh cover.
        // Nếu chỉ dựa vào commit -> khi zoom/vị trí không đổi, commit là no-op nên
        // ProseMirror không gọi update() -> render() không chạy -> ảnh giữ layout
        // crop (px tuyệt đối, max-width:none, overflow:visible) và tràn ra ngoài khung.
        render();
      };

      // Kéo ảnh trong crop -> dời vị trí (suy ngược ra object-position)
      let cropPanning = false;
      let cpStartX = 0;
      let cpStartY = 0;
      let cpBaseLeft = 0;
      let cpBaseTop = 0;

      const onCropPanMove = (event: PointerEvent) => {
        if (!cropPanning) return;
        event.preventDefault();
        const left = cpBaseLeft + (event.clientX - cpStartX);
        const top = cpBaseTop + (event.clientY - cpStartY);
        const denomX = dispW() - cropFW;
        const denomY = dispH() - cropFH;
        cPosX = denomX > 0 ? clamp((-left / denomX) * 100, 0, 100) : 50;
        cPosY = denomY > 0 ? clamp((-top / denomY) * 100, 0, 100) : 50;
        layoutCrop();
      };
      const onCropPanUp = () => {
        if (!cropPanning) return;
        cropPanning = false;
        window.removeEventListener("pointermove", onCropPanMove);
        window.removeEventListener("pointerup", onCropPanUp);
      };

      img.addEventListener("pointerdown", (event: PointerEvent) => {
        if (!cropping) return;
        // Chỉ kéo khi bấm TRONG khung. Phần ảnh phóng to tràn ra ngoài khung (vùng mờ,
        // nơi đặt thanh zoom bên phải) không được bắt kéo -> tránh "kéo nhầm" khi chỉnh zoom.
        const fr = frame.getBoundingClientRect();
        const inside =
          event.clientX >= fr.left &&
          event.clientX <= fr.right &&
          event.clientY >= fr.top &&
          event.clientY <= fr.bottom;
        if (!inside) return;
        event.preventDefault();
        event.stopPropagation();
        cropPanning = true;
        cpStartX = event.clientX;
        cpStartY = event.clientY;
        cpBaseLeft = -(dispW() - cropFW) * (cPosX / 100);
        cpBaseTop = -(dispH() - cropFH) * (cPosY / 100);
        window.addEventListener("pointermove", onCropPanMove);
        window.addEventListener("pointerup", onCropPanUp);
      });

      zoomBar.addEventListener("pointerdown", (e) => e.stopPropagation());
      zoomBar.addEventListener("input", () => {
        cZoom = clamp(Number(zoomBar.value) || 1, 1, MAX_ZOOM);
        cPosX = clamp(cPosX, 0, 100);
        cPosY = clamp(cPosY, 0, 100);
        layoutCrop();
      });
      doneBtn.addEventListener("pointerdown", (e) => e.stopPropagation());
      doneBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        exitCrop(true);
      });

      // Khi đang cắt: chặn kéo-thả gốc của trình duyệt (ảnh/node mặc định draggable ->
      // rê chuột tạo "ảnh ma" bay theo con trỏ). dragstart nổi bọt nên bắt ở wrap là đủ.
      wrap.addEventListener("dragstart", (event) => {
        if (cropping) event.preventDefault();
      });

      // Nhận lệnh mở crop từ nút "Cắt ảnh" trên thanh công cụ
      wrap.addEventListener("desc-image-crop-start", () => enterCrop());

      const onDocPointerDown = (event: PointerEvent) => {
        if (!cropping) return;
        const t = event.target as Node | null;
        if (t && !wrap.contains(t)) exitCrop(true);
      };
      document.addEventListener("pointerdown", onDocPointerDown, true);

      render();

      return {
        dom: wrap,
        update: (updatedNode) => {
          if (updatedNode.type.name !== "image") return false;
          currentNode = updatedNode;
          if (!cropping) render();
          return true;
        },
        ignoreMutation: () => true,
        destroy: () => {
          document.removeEventListener("pointerdown", onDocPointerDown, true);
        },
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
