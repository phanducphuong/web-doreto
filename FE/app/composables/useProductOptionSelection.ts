import type { InjectionKey, Ref } from "vue";
import type { TExistedProduct, TOptionValue } from "~/types/product.type";

export type TProductOptionSelection = ReturnType<typeof useProductOptionSelection>;

export const PRODUCT_OPTION_SELECTION_KEY: InjectionKey<TProductOptionSelection> = Symbol(
  "product-option-selection",
);

export function getOptionValueId(option: TOptionValue) {
  return String(option._id ?? option.productOptionNames.join("|"));
}

export function useProductOptionSelection(product: Ref<TExistedProduct | undefined | null>) {
  const selectedMap = reactive<(string | null)[]>([]);

  const resetSelectedMap = () => {
    const options = product.value?.productOptions ?? [];
    selectedMap.length = 0;
    selectedMap.push(...Array(options.length).fill(null));

    const inStock = product.value?.optionValues?.filter((option) => (option.stock ?? 0) > 0) ?? [];
    if (inStock.length === 1 && options.length > 0) {
      inStock[0]?.productOptionNames.forEach((name, index) => {
        if (index < selectedMap.length) {
          selectedMap[index] = name;
        }
      });
    }
  };

  watch(
    () => [product.value?._id, product.value?.productOptions?.length] as const,
    () => resetSelectedMap(),
    { immediate: true },
  );

  const inStockOptions = computed(
    () => product.value?.optionValues?.filter((option) => (option.stock ?? 0) > 0) ?? [],
  );

  const optionDimensionCount = computed(() => product.value?.productOptions?.length ?? 0);

  const isFullySelected = computed(() => {
    if (!optionDimensionCount.value) {
      return inStockOptions.value.length <= 1;
    }
    return (
      selectedMap.length === optionDimensionCount.value && selectedMap.every((value) => value !== null)
    );
  });

  const matchedOptions = computed(() => {
    if (!product.value?.optionValues) return [];
    return product.value.optionValues.filter(
      (optionValue) =>
        (optionValue.stock ?? 0) > 0 &&
        selectedMap.every(
          (selectedValue, optionIndex) =>
            selectedValue === null ||
            optionValue.productOptionNames[optionIndex] === selectedValue,
        ),
    );
  });

  const selectedOption = computed(() => {
    if (!isFullySelected.value) return null;
    return matchedOptions.value[0] ?? null;
  });

  const activeOptionValueId = computed(() => {
    if (selectedOption.value) {
      return getOptionValueId(selectedOption.value);
    }
    if (matchedOptions.value.length === 1) {
      return getOptionValueId(matchedOptions.value[0]!);
    }
    return null;
  });

  const isDimensionDisabled = (optionIndex: number, value: string) => {
    if (selectedMap[optionIndex] === value) return false;

    const nextSelected = [...selectedMap];
    nextSelected[optionIndex] = value;

    return !product.value?.optionValues?.some((optionValue) =>
      nextSelected.every(
        (selectedValue, index) =>
          selectedValue === null || optionValue.productOptionNames[index] === selectedValue,
      ),
    );
  };

  const selectDimension = (optionIndex: number, value: string) => {
    selectedMap[optionIndex] = selectedMap[optionIndex] === value ? null : value;
  };

  const selectOptionValue = (optionValue: TOptionValue) => {
    optionValue.productOptionNames.forEach((name, index) => {
      if (index < selectedMap.length) {
        selectedMap[index] = name;
      }
    });
  };

  const getStripLabels = (option: TOptionValue) => {
    const names = option.productOptionNames.filter(Boolean);
    if (names.length <= 1) {
      return {
        primary: names[0] || "Phân loại",
        secondary: "",
      };
    }
    return {
      primary: names[0]!,
      secondary: names.slice(1).join(" / "),
    };
  };

  return {
    selectedMap,
    inStockOptions,
    optionDimensionCount,
    isFullySelected,
    matchedOptions,
    selectedOption,
    activeOptionValueId,
    isDimensionDisabled,
    selectDimension,
    selectOptionValue,
    getStripLabels,
    getOptionValueId,
  };
}
