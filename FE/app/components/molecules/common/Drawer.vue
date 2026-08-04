<template>
  <ClientOnly>
    <Teleport to="body">
      <!-- invisible khi đóng: chặn drawer lóe lên lúc 100dvh đổi (thanh địa chỉ mobile thu gọn/bung ra);
           transition-all giữ visibility hiển thị đến khi hiệu ứng trượt đóng chạy xong -->
      <div
        class="fixed transition-all duration-300 z-50"
        :class="{ 'drawer-container-opened': isOpen, invisible: !isOpen }"
        v-bind="$attrs"
        :style="{
          top: isOpen ? drawerState.y : intitialCordiator.y,
          left: isOpen ? drawerState.x : intitialCordiator.x,
        }"
      >
        <slot />
      </div>
    </Teleport>
  </ClientOnly>
</template>
<script setup lang="ts">
const props = defineProps<{
  placement: "top" | "bottom" | "left" | "right";
}>();
const route = useRoute();

defineOptions({
  inheritAttrs: false,
});

type TCorditor = {
  x: number | string;
  y: number | string;
};

type TDrawerState = TCorditor & {};

const isOpen = ref(false);
const drawerState = reactive<TDrawerState>({
  x: 0,
  y: 0,
});

/** Vị trí đóng — dùng chung SSR/client để tránh lệch hydration / panel lọt giữa màn hình. */
const intitialCordiator = computed(() => {
  switch (props.placement) {
    case "top":
      return { x: 0, y: "-100dvh" };
    case "bottom":
      return { x: 0, y: "100dvh" };
    case "left":
      return { x: "-100vw", y: 0 };
    case "right":
      return { x: "100vw", y: 0 };
  }
});

const toggle = (corditor: TCorditor) => {
  drawerState.x = corditor.x;
  drawerState.y = corditor.y;
  isOpen.value = !isOpen.value;
};

const close = () => {
  isOpen.value = false;
};

// * EXPOSE
defineExpose({
  toggle,
  close,
  isOpen: readonly(isOpen),
});

watch(route, () => {
  if (isOpen.value) {
    close();
  }
});
</script>
