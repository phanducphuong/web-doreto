<template>
  <article class="rounded-6 border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
    <div class="flex flex-col text-on-surface">
    <div class="flex min-w-0 gap-3 items-center">
      <!-- * AVATAR -->
      <div
        class="flex size-8 shrink-0 center-child rounded-full bg-on-surface text-xs font-semibold text-white sm:(size-11 text-sm)"
      >
        {{ initials }}
      </div>
      <div>
        <h4 class="text-sm font-semibold sm:text-base">
          {{ authorName }}
          <span
            v-if="isOwnFeedback"
            class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-10px font-semibold text-emerald-700 sm:(px-3 py-1 text-xs)"
          >
            Đánh giá của bạn
          </span>
        </h4>
      </div>

      <button
        v-if="isOwnFeedback"
        type="button"
        class="w-fit ml-auto rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-300 disabled:(cursor-not-allowed opacity-60) sm:(px-4 py-2 text-sm)"
        :disabled="isDeleting"
        @click="$emit('delete', feedback)"
      >
        {{ isDeleting ? "Đang xóa..." : "Xóa đánh giá" }}
      </button>
    </div>
    <div class="min-w-0 space-y-2.5 sm:space-y-3">
      <div class="flex flex-wrap items-center gap-2 sm:gap-3"></div>
      <AtomsUiRating :rating="feedback.score || 0" :truncate="false" class="!mt-1" />

      <p v-if="purchasedOptionLine" class="text-xs text-stone-500 font-medium">
        Mặt hàng: {{ purchasedOptionLine }}
      </p>

      <p v-if="feedback.comment" class="text-sm lg:text-base leading-6">
        {{ feedback.comment }}
      </p>

      <div v-if="feedback.images.length" class="grid grid-cols-3 gap-2 xl:grid-cols-8">
        <button
          v-for="(image, imageIndex) in feedback.images"
          :key="image"
          type="button"
          class="overflow-hidden rounded-4 border border-stone-200 aspect-3/4 w-full cursor-zoom-in p-0 bg-transparent"
          aria-label="Phóng to ảnh đánh giá"
          @click="openFeedbackImage(imageIndex)"
        >
          <NuxtImg
            :src="image"
            alt="Ảnh đánh giá sản phẩm"
            :width="220"
            :height="293"
            fit="cover"
            class="h-full w-full object-cover object-center"
          />
        </button>
      </div>

      <div v-if="isAdmin && !feedbackReply" class="pt-2">
        <AtomsButton
          type="primaryGradient"
          class="min-h-8 text-xs"
          :disabled="isReplying"
          @click="isReplyFormOpen = !isReplyFormOpen"
        >
          {{ isReplyFormOpen ? "Ẩn phản hồi" : "Phản hồi" }}
        </AtomsButton>
      </div>
    </div>
  </div>

  <AtomsUiInlineError class="mt-4" :message="deleteError" />

  <div v-if="showReplySection" class="mt-4 border-t border-stone-200 pt-4 sm:(mt-5 pt-5)">
    <MoleculesFeedbackAdminReplyInline
      :feedback="feedback"
      :error="replyError"
      :is-submitting="isReplying"
      @submit="(payload) => $emit('reply', { feedback, payload })"
    />
    </div>
  </article>
</template>

<script setup lang="ts">
import type { TFeedback, TFeedbackReplyPayload } from "~/types/feedback.type";
import {
  getFeedbackAuthor,
  getEntityId,
  getFeedbackAuthorInitials,
  getFeedbackDisplayName,
  getFeedbackMatchedPurchaseItem,
  getFeedbackReply,
  maskFeedbackDisplayName,
} from "~/utils/feedback.utils";

const props = withDefaults(
  defineProps<{
    feedback: TFeedback;
    currentUserId?: string;
    isAdmin?: boolean;
    isReplying?: boolean;
    isDeleting?: boolean;
    replyError?: string;
    deleteError?: string;
  }>(),
  {
    currentUserId: "",
    isAdmin: false,
    isReplying: false,
    isDeleting: false,
    replyError: "",
    deleteError: "",
  },
);

defineEmits<{
  reply: [payload: { feedback: TFeedback; payload: TFeedbackReplyPayload }];
  delete: [feedback: TFeedback];
}>();

const { emitOpenImageLightbox } = useImageLightbox();

const openFeedbackImage = (index: number) => {
  emitOpenImageLightbox({ images: props.feedback.images, index });
};

const author = computed(() => getFeedbackAuthor(props.feedback));
const authorName = computed(() =>
  maskFeedbackDisplayName(getFeedbackDisplayName(props.feedback)),
);
const initials = computed(() =>
  getFeedbackAuthorInitials({
    name: getFeedbackDisplayName(props.feedback),
  }),
);
const purchasedItem = computed(() => getFeedbackMatchedPurchaseItem(props.feedback));
const purchasedOptionLine = computed(() => {
  const names = purchasedItem.value?.productOptionValue?.productOptionNames?.filter(Boolean) ?? [];
  return names.join(" / ");
});
const feedbackReply = computed(() => getFeedbackReply(props.feedback));
const isReplyFormOpen = ref(false);
const showReplySection = computed(
  () => Boolean(feedbackReply.value) || (props.isAdmin && isReplyFormOpen.value),
);

const isOwnFeedback = computed(() => {
  if (!props.currentUserId) return false;
  const feedbackUserId = getEntityId(author.value) || String(props.feedback.userId || "");
  return feedbackUserId === props.currentUserId;
});

watch(feedbackReply, (value) => {
  if (value) {
    isReplyFormOpen.value = false;
  }
});
</script>
