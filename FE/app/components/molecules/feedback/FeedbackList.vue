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
        v-for="item in visibleItems"
        :key="item._id"
        :feedback="item"
        :current-user-id="currentUserId"
        :delete-error="deleteErrors[String(item._id)] || ''"
        :is-admin="isAdmin"
        :is-deleting="deletingId === String(item._id)"
        :is-replying="replyingId === String(item._id)"
        :reply-error="replyErrors[String(item._id)] || ''"
        @delete="$emit('delete', $event)"
        @reply="$emit('reply', $event)"
      />

      <button
        v-if="hiddenCount > 0"
        type="button"
        class="mx-auto flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-5 py-2 text-xs font-semibold text-stone-600 transition hover:(border-stone-300 text-stone-800) sm:text-sm"
        @click="showMore"
      >
        Xem thêm đánh giá ({{ hiddenCount }})
        <ChevronDown class="size-4" />
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ChevronDown } from "lucide-vue-next";
import type { TFeedback, TFeedbackReplyPayload } from "~/types/feedback.type";
import FeedbackItem from "~/components/molecules/feedback/FeedbackItem.vue";

const INITIAL_VISIBLE_COUNT = 5;

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

const visibleCount = ref(INITIAL_VISIBLE_COUNT);
const visibleItems = computed(() => props.items.slice(0, visibleCount.value));
const hiddenCount = computed(() => Math.max(0, props.items.length - visibleCount.value));

const showMore = () => {
  visibleCount.value += INITIAL_VISIBLE_COUNT;
};
</script>
