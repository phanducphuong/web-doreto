<template>
  <ClientOnly v-if="modalVisible">
    <Teleport to="body">
      <div
        class="modal bg-black/50 w-screen h-screen fixed top-0 left-0 z-[9998] center-child overflow-hidden"
        @click="closeOnClickOverlay ? closeModal() : null"
      >
        <div
          :style="{ width: `${width}px` }"
          :class="[
            'flex flex-col overflow-hidden bg-white rounded-2xl shadow-lg relative',
            {
              'w-full h-full': isFullScreen,
              'max-w-[calc(100vw-32px)] max-h-[calc(100dvh-32px)]': !isFullScreen,
            },
          ]"
          @click.stop
        >
          <!-- * HEADER -->
          <div v-if="header || isShowClose" class="cms-title flex items-center shrink-0 p-5">
            {{ header }}

            <AtomsButton
              v-if="isShowClose"
              class="ml-auto w-9 h-9"
              type="ghost"
              circle
              :icon="X"
              @click="closeModal"
            >
            </AtomsButton>
          </div>

          <!-- * BODY -->
          <div class="h-full min-h-0 overflow-auto transition-height p-5 pt-0">
            <slot />
          </div>

          <!-- * FOOTER -->
          <div
            v-if="$slots['footer']"
            class="shrink-0 p-5 flex items-center justify-end gap-3 bg-#ECE9E7 border-t border-#E2DCDA"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import { X } from "lucide-vue-next";
export type TAppModalProps = {
  defaultVisible?: boolean;
  header?: string;
  isFullScreen?: boolean;
  isShowClose?: boolean;
  closeOnClickOverlay?: boolean;
  width?: number;
};

const {
  header,
  isFullScreen = false,
  closeOnClickOverlay = true,
  isShowClose,
  width = 500,
  defaultVisible = false,
} = defineProps<TAppModalProps>();

const modalVisible = ref(defaultVisible || false);
const emits = defineEmits<{
  (e: "on-close-modal", value: boolean): void;
}>();

// * METHODS
const openModal = () => {
  modalVisible.value = true;
};

const closeModal = () => {
  modalVisible.value = false;
  emits("on-close-modal", true);
};

// * EXPOSE
defineExpose({
  openModal,
  closeModal,
});
</script>
