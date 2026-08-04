<template>
  <div class="space-y-5 sm:space-y-6">
    <div
      v-for="(option, optionIndex) in selectOption"
      :key="option.label"
      class="space-y-3"
    >
      <!-- Label -->
      <div class="flex justify-between items-center">
        <label class="text-base font-bold text-on-surface first-letter:uppercase sm:text-lg">
          {{ option.label }}
        </label>
      </div>

      <!-- Values dạng thẻ ảnh (kiểu TikTok Shop) — chỉ áp dụng cho option màu sắc -->
      <div v-if="option.hasImages" class="grid grid-cols-3 gap-1.5 sm:gap-2">
        <div v-for="value in option.values" :key="value.name" class="relative">
          <button
            :disabled="isDisabled(optionIndex, value.name)"
            class="w-full cursor-pointer overflow-hidden rounded-lg transition-all disabled:(opacity-40 cursor-not-allowed)"
            :class="
              selectedMap[optionIndex] === value.name
                ? 'bg-primary/10 ring-2 ring-primary shadow-sm'
                : 'bg-surface-container-low ring-1 ring-outline-variant hover:(bg-primary/8 ring-primary/45)'
            "
            @click="handleCardClick(optionIndex, option, value)"
          >
            <div class="aspect-[3/4] w-full overflow-hidden bg-surface-container-low">
              <AtomsUiImageWithFallback
                :src="value.imageUrl"
                :alt="value.name"
                :width="180"
                :height="240"
                format="webp"
                loading="lazy"
                img-class="h-full w-full object-cover"
              />
            </div>
            <p
              class="line-clamp-2 px-1.5 py-1.5 text-center text-sm font-semibold leading-snug sm:text-base"
              :class="
                selectedMap[optionIndex] === value.name ? 'text-secondary' : 'text-on-surface-variant'
              "
            >
              {{ value.name }}
            </p>
          </button>
          <!-- Nút phóng to ảnh -->
          <button
            v-if="value.imageUrl"
            type="button"
            aria-label="Phóng to ảnh"
            class="absolute left-1 top-1 h-6 w-6 center-child cursor-pointer rounded-full bg-black/45 text-white transition-colors hover:bg-black/65"
            @click.stop="openImageZoom(option, value)"
          >
            <Maximize2 class="size-3.5" />
          </button>
        </div>
      </div>

      <!-- Values dạng chữ (không có ảnh) -->
      <div v-else class="flex flex-wrap gap-2.5 sm:gap-3">
        <button
          v-for="value in option.values"
          :key="value.name"
          :disabled="isDisabled(optionIndex, value.name)"
          :class="[
            'rounded-lg px-4 py-1.5 text-base font-semibold leading-snug transition-all cursor-pointer disabled:(opacity-40 cursor-not-allowed) sm:(px-5 py-2 text-lg)',
            selectedMap[optionIndex] === value.name
              ? 'bg-primary/15 text-secondary ring-2 ring-primary shadow-sm'
              : 'bg-surface-container-low text-on-surface-variant ring-1 ring-outline-variant hover:(bg-primary/8 ring-primary/45 text-on-surface)',
          ]"
          @click="handleSelect(optionIndex, value.name)"
        >
          {{ value.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { Maximize2 } from "lucide-vue-next";
import type { TExistedProduct, TOptionValue } from "~/types/product.type";
import { PRODUCT_OPTION_SELECTION_KEY } from "~/composables/useProductOptionSelection";

type TOptionDisplayValue = {
  name: string;
  imageUrl?: string;
};

type TOptionDisplay = {
  label: string;
  hasImages: boolean;
  values: TOptionDisplayValue[];
};

const props = defineProps<{
  product?: TExistedProduct;
}>();

const emit = defineEmits<{
  (
    e: "select-product",
    value: {
      optionList: TOptionValue[];
      isFullySelected: boolean;
    },
  ): void;
}>();

const injectedSelection = inject(PRODUCT_OPTION_SELECTION_KEY, null);
const { emitOpenImageLightbox } = useImageLightbox();

const productExistedList = ref<TOptionValue[]>([]);
const localSelectedMap = reactive<(string | null)[]>([]);
const selectedMap = injectedSelection?.selectedMap ?? localSelectedMap;

watch(
  () => props.product?.productOptions,
  (options) => {
    if (injectedSelection || !options) return;
    localSelectedMap.length = 0;
    localSelectedMap.push(...Array(options.length).fill(null));
  },
  { immediate: true },
);

const selectOption = computed<TOptionDisplay[]>(() => {
  if (!props.product) return [];

  const productOptions = props.product.productOptions || [];
  const optionValues = props.product.optionValues || [];

  return productOptions.map((option, optionIndex) => {
    const names = Array.from(
      new Set(optionValues.map((value) => value.productOptionNames?.[optionIndex]!)),
    ).filter(Boolean);

    const values = names.map((name) => ({
      name,
      imageUrl: optionValues.find(
        (value) => value.productOptionNames?.[optionIndex] === name && value.imageUrl,
      )?.imageUrl,
    }));

    // Chỉ option màu sắc mới hiển thị dạng thẻ ảnh, các option khác giữ dạng nút chữ
    const isColorOption = /màu|mau sac|color/i.test(option);

    return {
      label: option,
      hasImages: isColorOption && values.some((value) => value.imageUrl),
      values,
    };
  });
});

const getMatchedOptions = () => {
  return (
    props.product?.optionValues?.filter(
      (optionValue) =>
        (optionValue.stock ?? 0) > 0 &&
        selectedMap.every(
          (selectedValue, optionIndex) =>
            selectedValue === null || optionValue.productOptionNames[optionIndex] === selectedValue,
        ),
    ) || []
  );
};

const isFullySelected = () => {
  const options = props.product?.productOptions ?? [];
  if (!options.length) return true;
  return options.length === selectedMap.length && selectedMap.every((v) => v !== null);
};

function isDisabled(optionIndex: number, value: string) {
  if (injectedSelection) {
    return injectedSelection.isDimensionDisabled(optionIndex, value);
  }

  if (selectedMap[optionIndex] === value) return false;

  const nextSelected = [...selectedMap];
  nextSelected[optionIndex] = value;

  const isValid = props.product?.optionValues?.some((optionValue) =>
    nextSelected.every(
      (selectedValue, index) =>
        selectedValue === null || optionValue.productOptionNames[index] === selectedValue,
    ),
  );

  return !isValid;
}

const emitSelection = () => {
  productExistedList.value = getMatchedOptions();
  emit("select-product", {
    optionList: productExistedList.value,
    isFullySelected: isFullySelected(),
  });
};

function handleSelect(index: number, value: string) {
  if (injectedSelection) {
    injectedSelection.selectDimension(index, value);
    return;
  }

  localSelectedMap[index] = localSelectedMap[index] === value ? null : value;
  emitSelection();
}

function openImageZoom(option: TOptionDisplay, value: TOptionDisplayValue) {
  const slides = option.values.filter((item) => item.imageUrl);
  if (!slides.length) return;

  const index = slides.findIndex((item) => item.name === value.name);
  emitOpenImageLightbox({
    images: slides.map((item) => item.imageUrl!),
    index: Math.max(0, index),
  });
}

// Chạm 2 lần liên tiếp vào cùng một thẻ → mở popup ảnh phóng to
// (dblclick không đáng tin trên mobile nên tự bắt theo thời gian giữa 2 lần chạm)
const DOUBLE_TAP_MS = 350;
let lastTapKey = "";
let lastTapTime = 0;

function handleCardClick(optionIndex: number, option: TOptionDisplay, value: TOptionDisplayValue) {
  const key = `${optionIndex}:${value.name}`;
  const now = Date.now();
  const isDoubleTap = lastTapKey === key && now - lastTapTime < DOUBLE_TAP_MS;
  lastTapKey = key;
  lastTapTime = now;

  if (isDoubleTap && value.imageUrl) {
    openImageZoom(option, value);
    return;
  }

  handleSelect(optionIndex, value.name);
}

watch(
  () => injectedSelection?.selectedMap,
  () => {
    if (!injectedSelection) return;
    emitSelection();
  },
  { deep: true, immediate: true },
);
</script>
