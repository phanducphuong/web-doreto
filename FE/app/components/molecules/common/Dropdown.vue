<template>
  <div ref="triggerRef" class="inline-block">
    <!-- * TRIGGER -->
    <div
      tabindex="0"
      @click="toggle"
      @keydown.enter.prevent="toggle"
      @keydown.space.prevent="toggle"
    >
      <slot name="trigger">
        <button
          type="button"
          class="p-1.5 rounded-md hover:bg-third-light/20 transition-colors"
        >
          <EllipsisVertical class="size-4" />
        </button>
      </slot>
    </div>

    <!-- * MENU -->
    <ClientOnly>
      <Teleport to="body">
        <Transition name="dropdown">
          <div
            v-if="isOpen"
            ref="menuRef"
            role="menu"
            :style="menuStyle"
            class="fixed z-[9999] min-w-40 bg-white border-base rounded-md shadow-md py-1 text-sm outline-none"
          >
            <template v-for="(group, gi) in normalizedGroups" :key="gi">
              <!-- Separator giữa các group -->
              <div v-if="gi > 0" class="my-1 h-px bg-third-light/40" />

              <!-- Group label -->
              <div
                v-if="group.label"
                class="px-3 pt-1 pb-0.5 text-xs font-medium text-third-light select-none"
              >
                {{ group.label }}
              </div>

              <!-- Items -->
              <button
                v-for="(item, ii) in group.items"
                :key="item.value"
                :ref="(el) => setItemRef(el, gi, ii)"
                type="button"
                role="menuitem"
                :disabled="item.disabled"
                :class="[
                  'w-full text-left px-3 py-1.5 flex items-center gap-2 transition-colors outline-none',
                  item.disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : item.destructive
                      ? 'hover:bg-danger/10 focus:bg-danger/10 text-danger cursor-pointer'
                      : 'hover:bg-third-light/20 focus:bg-third-light/20 cursor-pointer',
                ]"
                @click="select(item)"
              >
                <component
                  :is="item.icon"
                  v-if="item.icon"
                  class="size-4 shrink-0"
                />
                <span class="flex-1">{{ item.label }}</span>
              </button>
            </template>
          </div>
        </Transition>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { EllipsisVertical } from "lucide-vue-next";
import type {
  TDropdownMenuItem,
  TDropdownMenuGroup,
} from "~/types/drop-down.type";
import type { TPosition } from "~/types/base.type";
const {
  items = [],
  groups = [],
  position = "bottom-start",
  disabled = false,
} = defineProps<{
  items?: TDropdownMenuItem[];
  groups?: TDropdownMenuGroup[];
  position?: TPosition;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  select: [item: TDropdownMenuItem];
}>();

// * STATES
const triggerRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const rect = ref<DOMRect | null>(null);
const itemRefs = ref<HTMLButtonElement[]>([]);
let focusedIndex = -1;

const normalizedGroups = computed<TDropdownMenuGroup[]>(() => {
  if (groups.length) return groups;
  if (items.length) return [{ items }];
  return [];
});

const GAP = 4;

// * COMPUTED
const menuStyle = computed<CSSProperties>(() => {
  if (!rect.value) return { visibility: "hidden" };
  const r = rect.value;
  switch (position) {
    case "bottom-end":
      return {
        top: `${r.bottom + GAP}px`,
        left: `${r.right}px`,
        transform: "translateX(-100%)",
      };
    case "top-start":
      return {
        top: `${r.top - GAP}px`,
        left: `${r.left}px`,
        transform: "translateY(-100%)",
      };
    case "top-end":
      return {
        top: `${r.top - GAP}px`,
        left: `${r.right}px`,
        transform: "translate(-100%,-100%)",
      };
    default:
      return { top: `${r.bottom + GAP}px`, left: `${r.left}px` };
  }
});

// * METHODS
function setItemRef(el: unknown, gi: number, ii: number) {
  let abs = ii;
  for (let g = 0; g < gi; g++)
    abs += normalizedGroups.value[g]?.items?.length ?? 0;
  if (el) itemRefs.value[abs] = el as HTMLButtonElement;
}

function toggle() {
  if (disabled || !import.meta.client) return;
  if (!isOpen.value) {
    rect.value = triggerRef.value?.getBoundingClientRect() ?? null;
    itemRefs.value = [];
    focusedIndex = -1;
  }
  isOpen.value = !isOpen.value;
}

function close() {
  isOpen.value = false;
  focusedIndex = -1;
}

function select(item: TDropdownMenuItem) {
  if (item.disabled) return;
  emit("select", item);
  close();
}

function onClickOutside(e: MouseEvent) {
  const t = e.target as Node;
  if (triggerRef.value?.contains(t) || menuRef.value?.contains(t)) return;
  close();
}

function onGlobalKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") close();
}

function updateRect() {
  if (isOpen.value)
    rect.value = triggerRef.value?.getBoundingClientRect() ?? null;
}

// * HOOKS
onMounted(() => {
  if (!import.meta.client) return;
  document.addEventListener("mousedown", onClickOutside);
  document.addEventListener("keydown", onGlobalKeydown);
  window.addEventListener("scroll", updateRect, true);
  window.addEventListener("resize", updateRect);
});

onUnmounted(() => {
  document.removeEventListener("mousedown", onClickOutside);
  document.removeEventListener("keydown", onGlobalKeydown);
  window.removeEventListener("scroll", updateRect, true);
  window.removeEventListener("resize", updateRect);
});
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scaleY(0.95);
  transform-origin: top;
}
</style>
