<template>
  <section class="rounded-5 border border-stone-200 bg-stone-50 p-3 sm:p-4">
    <div v-if="feedbackReply" class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div>
          <p class="text-xs font-semibold text-stone-900 sm:text-sm">Phản hồi từ quản trị viên</p>
        </div>
      </div>

      <p
        v-if="feedbackReply.content"
        class="text-xs leading-5 text-stone-700 sm:(text-sm leading-6)"
      >
        {{ feedbackReply.content }}
      </p>

      <div
        v-if="feedbackReply.images?.length"
        class="grid grid-cols-2 gap-2 sm:(grid-cols-3 gap-3)"
      >
        <a
          v-for="image in feedbackReply.images"
          :key="image"
          :href="image"
          target="_blank"
          rel="noreferrer"
          class="overflow-hidden rounded-4 border border-stone-200 aspect-3/4 w-full"
        >
          <NuxtImg
            :src="image"
            alt="Ảnh phản hồi admin"
            :width="220"
            :height="293"
            fit="cover"
            class="h-full w-full object-cover object-center"
          />
        </a>
      </div>
    </div>

    <form v-else class="space-y-3 sm:space-y-4" @submit.prevent="handleSubmit">
      <div class="space-y-2">
        <label class="text-xs font-semibold sm:text-sm">Phản hồi của admin</label>
        <AtomsFormTextArea
          v-model="content"
          :rows="4"
          :disabled="isSubmitting"
          placeholder="Trả lời ngắn gọn, rõ ràng và chỉ một lần cho đánh giá này."
        />
      </div>

      <MoleculesFeedbackImageUploaderInline
        v-model:existing-urls="existingImages"
        v-model:files="newFiles"
        :disabled="isSubmitting"
        :max-files="maxFiles"
        button-label="Đính kèm ảnh phản hồi"
      />

      <AtomsUiInlineError :message="localError || error" />

      <button
        type="submit"
        class="rounded-full bg-stone-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60 sm:(px-4 py-2.5 text-sm)"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? "Đang gửi phản hồi..." : "Gửi phản hồi" }}
      </button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { FEEDBACK_MESSAGES, FEEDBACK_REPLY_UPLOAD_MAX_FILES } from "~/constants/feedback.constant";
import type { TFeedback, TFeedbackReplyPayload } from "~/types/feedback.type";
import { getFeedbackReply, hasContent } from "~/utils/feedback.utils";

const props = withDefaults(
  defineProps<{
    feedback: TFeedback;
    error?: string;
    isSubmitting?: boolean;
    maxFiles?: number;
  }>(),
  {
    error: "",
    isSubmitting: false,
    maxFiles: FEEDBACK_REPLY_UPLOAD_MAX_FILES,
  },
);

const emit = defineEmits<{
  submit: [payload: TFeedbackReplyPayload];
}>();

const content = ref("");
const existingImages = ref<string[]>([]);
const newFiles = ref<File[]>([]);
const localError = ref("");

const feedbackReply = computed(() => getFeedbackReply(props.feedback));

watch(
  feedbackReply,
  (reply) => {
    content.value = reply?.content || "";
    existingImages.value = reply?.images ? [...reply.images] : [];
    newFiles.value = [];
    localError.value = "";
  },
  { deep: true, immediate: true },
);

const handleSubmit = () => {
  localError.value = "";

  if (!hasContent(content.value) && existingImages.value.length === 0 && !newFiles.value.length) {
    localError.value = FEEDBACK_MESSAGES.invalidReply;
    return;
  }

  emit("submit", {
    content: content.value.trim() || undefined,
    existingImages: [...existingImages.value],
    newFiles: [...newFiles.value],
  });
};
</script>
