<template>
  <section class="space-y-3 sm:space-y-4">
    <div
      v-if="error"
      class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
    >
      <button
        type="button"
        class="w-fit rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-stone-400 sm:(px-4 py-2 text-sm)"
        @click="$emit('retry')"
      >
        Tải lại
      </button>
    </div>

    <AtomsUiInlineError :message="error" />

    <div v-if="isLoading" class="space-y-4">
      <div
        v-for="item in 3"
        :key="item"
        class="rounded-6 border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <div class="h-4 w-32 rounded-full bg-stone-200" />
        <div class="mt-4 h-3 w-24 rounded-full bg-stone-100" />
        <div class="mt-4 h-3 w-full rounded-full bg-stone-100" />
        <div class="mt-2 h-3 w-3/4 rounded-full bg-stone-100" />
      </div>
    </div>

    <div v-if="items.length" class="space-y-4">
      <FeedbackItem
        v-for="item in previewItems"
        :key="item._id"
        v-bind="itemBindings(item)"
        @delete="$emit('delete', $event)"
        @reply="$emit('reply', $event)"
      />

      <button
        v-if="hiddenCount > 0"
        type="button"
        class="mx-auto flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-5 py-2 text-xs font-semibold text-stone-600 transition hover:(border-stone-300 text-stone-800) sm:text-sm"
        @click="openAllFeedback"
      >
        Xem thêm đánh giá ({{ hiddenCount }})
        <ChevronDown class="size-4" />
      </button>
    </div>

    <MoleculesCommonModal
      ref="modalRef"
      :header="`Tất cả đánh giá (${items.length})`"
      :width="640"
      is-show-close
    >
      <div class="space-y-4">
        <FeedbackItem
          v-for="item in items"
          :key="item._id"
          v-bind="itemBindings(item)"
          @delete="$emit('delete', $event)"
          @reply="$emit('reply', $event)"
        />
      </div>
    </MoleculesCommonModal>
  </section>
</template>

<script setup lang="ts">
import { ChevronDown } from "lucide-vue-next";
import type { TFeedback, TFeedbackReplyPayload } from "~/types/feedback.type";
import FeedbackItem from "~/components/molecules/feedback/FeedbackItem.vue";

const PREVIEW_COUNT = 5;

const props = withDefaults(
  defineProps<{
    items: TFeedback[];
    currentUserId?: string;
    isAdmin?: boolean;
    isLoading?: boolean;
    error?: string;
    replyingId?: string;
    deletingId?: string;
    replyErrors?: Record<string, string>;
    deleteErrors?: Record<string, string>;
  }>(),
  {
    currentUserId: "",
    isAdmin: false,
    isLoading: false,
    error: "",
    replyingId: "",
    deletingId: "",
    replyErrors: () => ({}),
    deleteErrors: () => ({}),
  },
);

defineEmits<{
  retry: [];
  reply: [payload: { feedback: TFeedback; payload: TFeedbackReplyPayload }];
  delete: [feedback: TFeedback];
}>();

const modalRef = ref();

const previewItems = computed(() => props.items.slice(0, PREVIEW_COUNT));
const hiddenCount = computed(() => Math.max(0, props.items.length - PREVIEW_COUNT));

const itemBindings = (item: TFeedback) => ({
  feedback: item,
  currentUserId: props.currentUserId,
  isAdmin: props.isAdmin,
  deleteError: props.deleteErrors[String(item._id)] || "",
  isDeleting: props.deletingId === String(item._id),
  isReplying: props.replyingId === String(item._id),
  replyError: props.replyErrors[String(item._id)] || "",
});

const openAllFeedback = () => {
  modalRef.value?.openModal();
};
</script>
