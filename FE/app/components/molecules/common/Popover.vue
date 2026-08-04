<template>
  <div class="inline-block">
    <div ref="triggerEl" class="inline-block" @click="onTriggerClick">
      <slot />
    </div>

    <ClientOnly>
      <Teleport to="body">
        <div
          v-show="open"
          ref="contentEl"
          class="fixed z-[9999] min-w-max border-base rounded-lg bg-white p-2 shadow-lg"
          :style="panelStyle"
          role="dialog"
          aria-modal="false"
        >
          <slot name="content" />
        </div>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
export type PopoverPlacement =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end"
  | "right"
  | "right-start"
  | "right-end";

type Side = "top" | "bottom" | "left" | "right";
type Align = "start" | "end" | "center";

const props = withDefaults(
  defineProps<{
    placement?: PopoverPlacement;
    /** Khoảng cách giữa trigger và panel (px) */
    offset?: number;
    /** Mở ngay khi mount (ít dùng) */
    defaultOpen?: boolean;
  }>(),
  {
    placement: "bottom-start",
    offset: 8,
    defaultOpen: false,
  },
);

const open = ref(props.defaultOpen);
const triggerEl = ref<HTMLElement | null>(null);
const contentEl = ref<HTMLElement | null>(null);

const panelStyle = ref<Record<string, string>>({
  top: "0px",
  left: "0px",
  visibility: "hidden",
});

function parsePlacement(p: PopoverPlacement): { side: Side; align: Align } {
  const parts = p.split("-") as string[];
  const side = parts[0] as Side;
  if (parts.length === 1) return { side, align: "center" };
  return { side, align: parts[1] as Align };
}

function computePanelPosition(): { top: number; left: number } {
  const trigger = triggerEl.value;
  const content = contentEl.value;
  if (!trigger || !content) return { top: 0, left: 0 };

  const t = trigger.getBoundingClientRect();
  const c = content.getBoundingClientRect();
  const { side, align } = parsePlacement(props.placement);
  const { offset } = props;
  let top = 0;
  let left = 0;

  switch (side) {
    case "bottom":
      top = t.bottom + offset;
      if (align === "start") left = t.left;
      else if (align === "end") left = t.right - c.width;
      else left = t.left + (t.width - c.width) / 2;
      break;
    case "top":
      top = t.top - c.height - offset;
      if (align === "start") left = t.left;
      else if (align === "end") left = t.right - c.width;
      else left = t.left + (t.width - c.width) / 2;
      break;
    case "left":
      left = t.left - c.width - offset;
      if (align === "start") top = t.top;
      else if (align === "end") top = t.bottom - c.height;
      else top = t.top + (t.height - c.height) / 2;
      break;
    case "right":
      left = t.right + offset;
      if (align === "start") top = t.top;
      else if (align === "end") top = t.bottom - c.height;
      else top = t.top + (t.height - c.height) / 2;
      break;
  }

  return { top, left };
}

async function updatePosition() {
  if (import.meta.server) return;
  if (!open.value) return;
  await nextTick();
  requestAnimationFrame(() => {
    const { top, left } = computePanelPosition();
    panelStyle.value = {
      top: `${top}px`,
      left: `${left}px`,
      visibility: "visible",
    };
  });
}

function onTriggerClick(e: MouseEvent) {
  e.stopPropagation();
  open.value = !open.value;
}

function onDocPointerDown(e: MouseEvent) {
  if (!open.value) return;
  const node = e.target as Node;
  if (triggerEl.value?.contains(node)) return;
  if (contentEl.value?.contains(node)) return;
  open.value = false;
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape" && open.value) {
    open.value = false;
  }
}

function onReposition() {
  if (open.value) void updatePosition();
}

watch(
  open,
  (isOpen) => {
    if (import.meta.server) return;
    if (isOpen) {
      panelStyle.value = { ...panelStyle.value, visibility: "hidden" };
      void updatePosition();
      document.addEventListener("pointerdown", onDocPointerDown, true);
      document.addEventListener("keydown", onKeyDown);
      window.addEventListener("scroll", onReposition, true);
      window.addEventListener("resize", onReposition);
    } else {
      document.removeEventListener("pointerdown", onDocPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onDocPointerDown, true);
  document.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("scroll", onReposition, true);
  window.removeEventListener("resize", onReposition);
});

defineExpose({
  open: () => {
    open.value = true;
  },
  close: () => {
    open.value = false;
  },
  toggle: () => {
    open.value = !open.value;
  },
  isOpen: readonly(open),
});
</script>
