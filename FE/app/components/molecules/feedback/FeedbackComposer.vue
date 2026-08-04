<template>
  <section class="rounded-6 border border-stone-200 bg-white p-4 shadow-sm sm:p-5 md:p-6">
    <div class="mb-2 space-y-2 sm:mb-5">
      <h3 class="text-lg font-semibold text-stone-950 sm:text-xl">{{ title }}</h3>
      <p v-if="helperText" class="text-xs leading-5 text-stone-600 sm:text-sm sm:leading-6">
        {{ helperText }}
      </p>
    </div>

    <div
      v-if="purchasedOptionLabels.length"
      class="mb-4 rounded-4 border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-700 sm:(mb-5 px-4 py-3 text-sm)"
    >
      <span class="font-semibold">Mặt hàng: </span>
      <span>{{ purchasedOptionLabels.join(", ") }}</span>
    </div>

    <form v-if="hasPurchased" class="space-y-4 sm:space-y-5" @submit.prevent="handleSubmit">
      <MoleculesFeedbackStarRatingInput v-model="score" :disabled="disabled || isSubmitting" />

      <div class="space-y-2">
        <label class="text-sm font-semibold text-stone-800">Nhận xét</label>
        <textarea
          v-model="comment"
          rows="5"
          class="w-full rounded-4 border border-stone-300 bg-stone-50 px-3 py-2.5 text-xs leading-5 text-stone-900 outline-none transition focus:border-stone-500 sm:(px-4 py-3 text-sm leading-6)"
          :disabled="disabled || isSubmitting"
          placeholder="Chia sẻ ngắn gọn điều bạn hài lòng hoặc chưa hài lòng về sản phẩm."
        />
      </div>

      <div class="space-y-2">
        <label class="text-sm font-semibold text-stone-800">Ảnh thực tế</label>
        <MoleculesFeedbackImageUploaderInline
          v-model:existing-urls="existingImages"
          v-model:files="newFiles"
          :disabled="disabled || isSubmitting"
          :max-files="maxFiles"
          button-label="Chọn ảnh đánh giá"
        />
      </div>

      <AtomsUiInlineError :message="localError || error" />

      <div class="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          type="submit"
          class="rounded-full bg-stone-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60 sm:(px-5 py-3 text-sm)"
          :disabled="disabled || isSubmitting"
        >
          {{ isSubmitting ? "Đang gửi..." : submitLabel }}
        </button>

        <button
          v-if="feedback"
          type="button"
          class="rounded-full border border-stone-300 px-4 py-2.5 text-xs font-semibold text-stone-700 transition hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-60 sm:(px-5 py-3 text-sm)"
          :disabled="disabled || isSubmitting"
          @click="resetForm"
        >
          Khôi phục nội dung hiện tại
        </button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { FEEDBACK_UPLOAD_MAX_FILES, FEEDBACK_MESSAGES } from "~/constants/feedback.constant";
import type { TFeedback, TFeedbackComposerPayload } from "~/types/feedback.type";
import { hasContent } from "~/utils/feedback.utils";

const props = withDefaults(
  defineProps<{
    feedback?: TFeedback | null;
    title?: string;
    helperText?: string;
    submitLabel?: string;
    error?: string;
    isSubmitting?: boolean;
    disabled?: boolean;
    maxFiles?: number;
    hasPurchased?: boolean;
    purchasedOptionLabels?: string[];
  }>(),
  {
    feedback: null,
    title: "Viết đánh giá",
    helperText: "",
    submitLabel: "Gửi đánh giá",
    error: "",
    isSubmitting: false,
    disabled: false,
    maxFiles: FEEDBACK_UPLOAD_MAX_FILES,
    hasPurchased: false,
    purchasedOptionLabels: () => [],
  },
);

const emit = defineEmits<{
  submit: [payload: TFeedbackComposerPayload];
}>();

const score = ref(0);
const comment = ref("");
const existingImages = ref<string[]>([]);
const newFiles = ref<File[]>([]);
const localError = ref("");

const applyFeedbackToForm = (feedback: TFeedback | null | undefined) => {
  score.value = feedback?.score || 0;
  comment.value = feedback?.comment || "";
  existingImages.value = feedback?.images ? [...feedback.images] : [];
  newFiles.value = [];
  localError.value = "";
};

watch(
  () => props.feedback,
  (feedback) => {
    applyFeedbackToForm(feedback);
  },
  { deep: true, immediate: true },
);

const resetForm = () => {
  applyFeedbackToForm(props.feedback);
};

const handleSubmit = () => {
  localError.value = "";

  if (
    !hasContent(comment.value) &&
    !score.value &&
    existingImages.value.length === 0 &&
    !newFiles.value.length
  ) {
    localError.value = FEEDBACK_MESSAGES.invalidComposer;
    return;
  }

  emit("submit", {
    comment: comment.value.trim() || undefined,
    existingImages: [...existingImages.value],
    newFiles: [...newFiles.value],
    score: score.value || undefined,
  });
};
</script>
