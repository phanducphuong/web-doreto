<template>
  <MoleculesCommonModal
    ref="modalRef"
    :header="formLabel"
    :is-show-close="true"
    :width="1000"
    :close-on-click-overlay="false"
  >
    <div class="vcu-product-modal space-y-6 pb-6 mt-8">
      <section class="space-y-5">
        <p class="section-title">Thông tin cơ bản</p>

        <AtomsFormItem
          label="Tên sản phẩm"
          :required="true"
          :error-message="formError.name"
          class-label="text-on-surface col-span-1 md:col-span-2"
        >
          <AtomsFormInput
            v-model="productForm.name"
            :disabled="!isEdit"
            :error="formError.name"
            placeholder="Nhập tên sản phẩm"
          />
        </AtomsFormItem>

        <div class="mt-4 space-y-4">
          <AtomsFormItem label="Khung ảnh mô tả">
            <MoleculesProductDescriptionFramePicker
              v-model="productForm.descriptionFrameId"
              :frames="activeDescriptionFrames"
              :loading="loadingDescriptionFrames"
              :disabled="!isEdit"
            />
          </AtomsFormItem>

          <AtomsFormItem label="Mô tả" :error-message="formError.description">
            <AtomsTiptapEditor
              v-model="productForm.description"
              :disabled="!isEdit"
              :error="formError.description"
              :ai-name="productForm.name || ''"
              :ai-category-names="selectedCategoryNames"
              :ai-tag-names="selectedTagNames"
              :allow-ai-generate="isEdit"
              :ai-replace-content="false"
            />
          </AtomsFormItem>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AtomsFormItem label="Danh mục" :required="true" :error-message="formError.categoryIds">
            <AtomsFormSelectBox
              v-model="productForm.categoryIds!"
              :options="categories.map((c) => ({ label: c.name, value: c._id! }))"
              is-multiple
              :disabled="!isEdit"
              :error="formError.categoryIds"
            />
          </AtomsFormItem>

          <AtomsFormItem label="Tag" :error-message="formError.tagIds">
            <AtomsFormSelectBox
              v-model="productForm.tagIds!"
              :options="tags?.map((c) => ({ label: c.name, value: c._id! })) || []"
              is-multiple
              :disabled="!isEdit"
              :error="formError.tagIds"
            />
          </AtomsFormItem>
        </div>
      </section>

      <section class="space-y-5">
        <div class="flex gap-3">
          <p class="section-title mb-0">Hình ảnh & Truyền thông</p>
          <p class="ml-auto mb-1 text-xs text-#D2ACA8">{{ productImageCount }} / 10 Hình ảnh</p>
        </div>

        <AtomsFormItem
          label="Hình ảnh sản phẩm"
          :required="true"
          :error-message="formError.imageUrls"
        >
          <MoleculesFilePicker
            v-model:files="productForm.imageFiles"
            v-model:urls="productForm.imageUrls"
            :disabled="!isEdit"
            multiple
            accept=".png,.webp,.jpg,.jpeg"
          />
        </AtomsFormItem>

        <AtomsFormItem
          label="Thumbnail Grid (1/5)"
          :required="true"
          :error-message="formError.thumbnailUrls"
        >
          <div class="flex flex-wrap gap-3">
            <div
              v-for="(thumb, idx) in thumbnailDisplayUrls"
              :key="`${thumb}-${idx}`"
              class="group relative h-20 w-20 overflow-hidden rounded-lg border border-primary-container/50"
            >
              <img :src="thumb" alt="thumbnail" class="h-full w-full object-cover" />
              <button
                v-if="isEdit"
                class="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-primary-container text-white group-hover:flex"
                @click.prevent="removeThumbnail(idx)"
              >
                <X class="size-3" />
              </button>
            </div>

            <AtomsSingleImagePicker
              v-if="isEdit && thumbnailDisplayUrls.length < 5"
              :file="null"
              :image-url="''"
              multiple
              @update:files="addThumbnailFiles"
            />
          </div>
        </AtomsFormItem>
      </section>

      <section class="space-y-5">
        <div class="mb-4 flex flex-wrap items-center gap-2">
          <p class="section-title">Cấu hình biến thể</p>
          <AtomsButton
            v-if="isEdit"
            type="link"
            class="ml-auto font-semibold"
            @click="productForm.optionValues!.push(createDefaultOptionValue())"
          >
            Thêm lựa chọn
          </AtomsButton>
        </div>

        <div class="rounded-xl bg-#EFEBEB p-4">
          <div class="mb-3 grid grid-cols-[230px_1fr] uppercase text-xs font-semibold gap-3">
            <p>Tên tùy chọn</p>
            <div class="flex items-center justify-between">
              Giá trị
              <AtomsButton
                circle
                type="ghost"
                class="text-primary"
                :icon="Plus"
                @click="productOptionValues.push(createOptionDef())"
              />
            </div>
          </div>
          <div
            v-for="(item, optionIndex) in productOptionValues"
            :key="item._uid"
            class="grid gap-3 md:grid-cols-[230px_1fr] mb-3 last:mb-0"
          >
            <AtomsFormInput
              v-model="item.name"
              :disabled="!isEdit"
              :error="formError.productOptions"
              placeholder="Nhập thông số"
            />
            <div class="flex items-center gap-2">
              <AtomsFormTagInput
                v-model="item.value"
                class="flex-1"
                :disabled="!isEdit"
                :error="formError.productOptions"
                placeholder="Nhập thông số"
              />
              <AtomsButton
                circle
                type="ghost"
                class="text-danger"
                :icon="Trash"
                :disabled="productOptionValues.length <= 1"
                @click="removeProductOptionValue(optionIndex)"
              ></AtomsButton>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[920px] border-collapse">
            <thead>
              <tr
                class="border-b border-#E4D4D1 text-left text-xs uppercase tracking-[0.06em] text-#8B7B78"
              >
                <th class="py-3">Ảnh</th>
                <th class="py-3">Biến thể</th>
                <th class="py-3">Mã biến thể</th>
                <th class="py-3">Giá bán</th>
                <th class="py-3">Giá gốc</th>
                <th class="py-3">Kho</th>
                <th class="py-3 text-right">Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(value, id) in productForm.optionValues"
                :key="value._id || id"
                class="border-b border-#EEE5E3 align-top"
              >
                <td class="py-4 pr-3">
                  <AtomsSingleImagePicker
                    class="!w-12 !h-12"
                    :file="value.imageFile?.[0] || null"
                    :image-url="value.imageUrl || ''"
                    :disabled="!isEdit"
                    @update:file="setOptionImageFile(id, $event)"
                  />
                  <p v-if="formError.optionValues?.[id]?.imageUrl" class="mt-1 text-xs text-danger">
                    {{ formError.optionValues?.[id]?.imageUrl }}
                  </p>
                </td>
                <td class="py-4 pr-3 w-1/5">
                  <MoleculesCommonPopover placement="bottom-start">
                    <p class="font-semibold text-xs cursor-pointer">
                      {{
                        value.productOptionNames?.filter(Boolean).join(" / ") ||
                        `Lựa chọn ${id + 1}`
                      }}
                    </p>
                    <template #content>
                      <div class="w-[320px] max-h-[300px] overflow-y-auto space-y-4 p-1">
                        <template v-if="variantOptionDefinitions.length">
                          <div
                            v-for="(option, optionIndex) in variantOptionDefinitions"
                            :key="`${option.name}-${optionIndex}`"
                            class="space-y-2"
                          >
                            <p
                              class="text-[10px] font-bold uppercase tracking-widest text-stone-400"
                            >
                              {{ option.name }}
                            </p>
                            <div class="flex flex-wrap gap-2">
                              <button
                                v-for="optionValue in option.values"
                                :key="`${option.name}-${optionValue}`"
                                type="button"
                                :disabled="!isEdit"
                                class="px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm border border-#f0d9d3 disabled:(opacity-50 cursor-not-allowed)"
                                :class="
                                  isOptionPicked(id, optionIndex, optionValue)
                                    ? 'ring-(primary 2) bg-primary/5 text-on-surface'
                                    : 'bg-surface text-stone-500 hover:ring-(outline-variant/60 1)'
                                "
                                @click.stop="toggleOptionValue(id, optionIndex, optionValue)"
                              >
                                {{ optionValue }}
                              </button>
                            </div>
                          </div>
                        </template>
                        <p v-else class="text-xs text-on-surface-variant">
                          Chưa có cấu hình tùy chọn. Hãy nhập tên và giá trị ở phía trên.
                        </p>
                      </div>
                    </template>
                  </MoleculesCommonPopover>
                  <p v-if="getOptionValueError(id)" class="mt-1 text-xs text-danger">
                    {{ getOptionValueError(id) }}
                  </p>
                  <p v-if="duplicateOptionValueIndexes.has(id)" class="mt-1 text-xs text-danger">
                    Tổ hợp biến thể trùng với dòng khác
                  </p>
                </td>
                <td class="py-4 pr-3 w-36">
                  <AtomsFormInput
                    v-model="value.code"
                    :disabled="!isEdit"
                    placeholder="VD: SP-001-RED-L"
                    maxlength="100"
                    :error="formError.optionValues?.[id]?.code"
                  />
                </td>
                <td class="py-4 pr-3">
                  <AtomsFormInput
                    v-model="value.price"
                    :disabled="!isEdit"
                    placeholder="Giá bán"
                    :format="formatPrice"
                    :parse="parsePrice"
                    :error="formError.optionValues?.[id]?.price"
                  />
                </td>
                <td class="py-4 pr-3">
                  <AtomsFormInput
                    v-model="value.originalPrice"
                    :disabled="!isEdit"
                    placeholder="Giá gốc"
                    :format="formatPrice"
                    :parse="parsePrice"
                    :error="formError.optionValues?.[id]?.originalPrice"
                  />
                </td>
                <td class="py-4 pr-3 w-30">
                  <AtomsFormInput
                    v-model="value.stock"
                    :disabled="!isEdit"
                    placeholder="Số lượng"
                    type="number"
                    :error="formError.optionValues?.[id]?.stock"
                  />
                </td>
                <td class="py-4 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <AtomsButton
                      v-if="isEdit"
                      class="w-8 h-8"
                      type="ghost"
                      circle
                      :icon="Copy"
                      @click="duplicateOptionValue(id)"
                    />
                    <AtomsButton
                      v-if="isEdit"
                      class="w-8 h-8"
                      type="ghost"
                      circle
                      :icon="X"
                      :disabled="(productForm.optionValues || []).length <= 1"
                      @click="deleteOptionValue(id)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="space-y-4">
        <p class="section-title mb-0">Sẵn sàng lưu thay đổi</p>
        <div
          v-if="!errorList.length"
          class="mb-4 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3"
        >
          <CheckCircle2 class="size-4 text-primary" />
          <p class="text-xs text-primary">Tất cả các trường bắt buộc đã được điền đầy đủ.</p>
        </div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div class="rounded-lg bg-surface-container p-3">
            <p class="text-xs text-on-surface-variant">Ảnh sản phẩm</p>
            <p class="mt-1 text-base font-semibold">{{ productImageCount }}</p>
          </div>
          <div class="rounded-lg bg-surface-container p-3">
            <p class="text-xs text-on-surface-variant">Thumbnail</p>
            <p class="mt-1 text-base font-semibold">
              {{ (productForm.thumbnailUrls || []).length }}
            </p>
          </div>
          <div class="rounded-lg bg-surface-container p-3">
            <p class="text-xs text-on-surface-variant">Biến thể</p>
            <p class="mt-1 text-base font-semibold">
              {{ (productForm.optionValues || []).length }}
            </p>
          </div>
          <div class="rounded-lg bg-surface-container p-3">
            <p class="text-xs text-on-surface-variant">Khoảng giá</p>
            <p class="mt-1 text-base font-semibold">{{ priceRangeLabel }}</p>
          </div>
        </div>

        <div
          v-if="errorList.length"
          class="mt-4 rounded-lg border border-danger/40 bg-danger/5 p-3"
        >
          <p class="text-sm font-semibold text-danger">
            Cần xử lý {{ errorList.length }} lỗi trước khi lưu
          </p>
          <ul class="mt-2 list-disc pl-4 text-xs text-danger space-y-1">
            <li v-for="(error, idx) in errorList" :key="idx">{{ error }}</li>
          </ul>
        </div>
      </section>
    </div>

    <template #footer>
      <AtomsButton v-if="defaultData?._id" type="link" class="mr-auto" @click="isEdit = !isEdit">
        {{ isEdit ? "Chuyển sang xem" : "Chỉnh sửa" }}
      </AtomsButton>

      <template v-if="isEdit">
        <AtomsButton
          v-if="defaultData?._id"
          type="danger"
          :icon="Trash"
          :is-loading="loadingStates.delete"
          @click="onDeleteProduct"
        >
          Xóa
        </AtomsButton>
        <AtomsButton
          type="primary"
          :is-loading="loadingStates.upsert"
          :icon="Save"
          @click="onSubmit"
        >
          {{ defaultData?._id ? "Cập nhật" : "Tạo mới" }}
        </AtomsButton>
      </template>
    </template>
  </MoleculesCommonModal>
</template>

<script setup lang="ts">
import { CheckCircle2, Copy, Plus, Save, Trash, X } from "lucide-vue-next";
import useImageFrame from "~/composables/image-frame.composable";
import useProduct from "~/composables/product.composable";
import type { TActiveImageFrame } from "~/types/image-frame.type";
import type { TExistedProduct } from "~/types/product.type";
import MoleculesCommonModal from "~/components/molecules/common/Modal.vue";
import { hasError } from "~/utils/data.utils";
import type { TMediaCompressionPreset } from "~/constants/media-compression.constant";
import { compressImageFile } from "~/utils/media-compression.utils";
import type { TExistedTag } from "~/types/tag.type";

const modalRef = ref<InstanceType<typeof MoleculesCommonModal>>();

const { defaultData, tags = [] } = defineProps<{
  defaultData?: TExistedProduct;
  tags?: TExistedTag[];
}>();

const { loadingStates, upsertProduct, deleteProduct, validateProductForm } = useProduct();
const { fetchActiveFrames, loadingStates: imageFrameLoadingStates } = useImageFrame();
const { $uploadRepository } = useNuxtApp();
const { categories } = storeToRefs(useCategoryStore());
const isEdit = ref(false);
const activeDescriptionFrames = ref<TActiveImageFrame[]>([]);
const loadingDescriptionFrames = computed(() => imageFrameLoadingStates.value.fetchActive);

const productForm = ref<Partial<TExistedProduct>>({});
const thumbnailPreviewUrls = ref<string[]>([]);

const selectedDescriptionFrame = computed(
  () =>
    activeDescriptionFrames.value.find(
      (frame) => frame._id === productForm.value.descriptionFrameId,
    ) ?? null,
);

const formError = ref<any>({});

const emits = defineEmits(["on-upsert-product-success", "on-delete-product-success"]);

const defaultOptionValue = {
  price: 0,
  productOptionNames: [],
  imageUrl: "",
  imageFile: [],
};

let _optionUidCounter = 0;
const createOptionDef = () => ({ _uid: ++_optionUidCounter, name: "", value: [] as string[] });
const productOptionValues = ref<{ _uid: number; name: string; value: string[] }[]>([
  createOptionDef(),
]);

const createDefaultOptionValue = () => ({
  code: "",
  price: defaultOptionValue.price,
  productOptionNames: [] as string[],
  imageUrl: defaultOptionValue.imageUrl,
  imageFile: [] as File[],
});

const buildVariantOptionValues = (data?: Partial<TExistedProduct>) => {
  if (!data?.productOptions?.length) return [createOptionDef()];

  return data.productOptions.map((optionName, optionIndex) => ({
    _uid: ++_optionUidCounter,
    name: optionName || "",
    value: Array.from(
      new Set(
        (data.optionValues || [])
          .map((optionValue) => optionValue.productOptionNames?.[optionIndex] || "")
          .filter(Boolean),
      ),
    ),
  }));
};

// * COMPUTED
const formLabel = computed(() => {
  if (defaultData?._id) {
    return isEdit.value ? "Cập nhật sản phẩm" : "Thông tin sản phẩm";
  }
  return "Tạo mới sản phẩm";
});

const priceRangeLabel = computed(() => {
  const prices = (productForm.value.optionValues || [])
    .map((item) => Number(item.price || 0))
    .filter((price) => price > 0);
  if (!prices.length) return "Chưa có";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return `${formatPrice(min)} - ${formatPrice(max)}`;
});

const errorList = computed(() => {
  const errors: string[] = [];
  if (formError.value?.name) errors.push(formError.value.name);
  if (formError.value?.categoryIds) errors.push(formError.value.categoryIds);
  if (formError.value?.imageUrls) errors.push(formError.value.imageUrls);
  if (formError.value?.thumbnailUrls) errors.push(formError.value.thumbnailUrls);
  if (formError.value?.productOptions) errors.push(formError.value.productOptions);
  if (duplicateOptionValueIndexes.value.size > 0) {
    errors.push(
      `Có ${duplicateOptionValueIndexes.value.size} biến thể bị trùng tổ hợp (dòng: ${[...duplicateOptionValueIndexes.value].map((i) => i + 1).join(", ")})`,
    );
  }
  formError.value?.optionValues?.forEach((item: any, index: number) => {
    if (item?.imageUrl) errors.push(`Lựa chọn ${index + 1}: ${item.imageUrl}`);
    if (item?.code) errors.push(`Lựa chọn ${index + 1}: ${item.code}`);
    if (item?.price) errors.push(`Lựa chọn ${index + 1}: ${item.price}`);
    if (item?.originalPrice) errors.push(`Lựa chọn ${index + 1}: ${item.originalPrice}`);
    item?.productOptionNames?.forEach((optionError: string, optionIndex: number) => {
      if (optionError) {
        errors.push(`Lựa chọn ${index + 1}, thông số ${optionIndex + 1}: ${optionError}`);
      }
    });
  });
  return errors;
});

const thumbnailDisplayUrls = computed(() => [
  ...(productForm.value.thumbnailUrls || []),
  ...thumbnailPreviewUrls.value,
]);

const productImageCount = computed(
  () => (productForm.value.imageUrls || []).length + (productForm.value.imageFiles || []).length,
);

const variantOptionDefinitions = computed(() =>
  productOptionValues.value
    .map((item) => ({
      name: (item.name || "").trim(),
      values: (item.value || []).map((value) => value.trim()).filter(Boolean),
    }))
    .filter((item) => item.name && item.values.length),
);

const selectedCategoryNames = computed(() =>
  (productForm.value.categoryIds || [])
    .map((id) => categories.value.find((category) => category._id === id)?.name)
    .filter((name): name is string => Boolean(name)),
);

const selectedTagNames = computed(() =>
  (productForm.value.tagIds || [])
    .map((id) => tags.find((tag) => tag._id === id)?.name)
    .filter((name): name is string => Boolean(name)),
);

// Tính toán độc lập – không phụ thuộc vào errors object
const duplicateOptionValueIndexes = computed(() => {
  const fingerprintMap = new Map<string, number>();
  const duplicates = new Set<number>();

  (productForm.value.optionValues || []).forEach((optionValue, index) => {
    const picked = (optionValue.productOptionNames || []).filter((n) => !!n?.trim());
    if (!picked.length) return; // skip rows chưa chọn gì – đã có validate riêng

    const fingerprint = picked.join("|");
    if (fingerprintMap.has(fingerprint)) {
      duplicates.add(fingerprintMap.get(fingerprint)!);
      duplicates.add(index);
    } else {
      fingerprintMap.set(fingerprint, index);
    }
  });

  return duplicates;
});

// * METHODS
const syncVariantOptionsToForm = () => {
  const optionNames = variantOptionDefinitions.value.map((item) => item.name);
  productForm.value.productOptions = optionNames;

  productForm.value.optionValues = (productForm.value.optionValues || []).map((optionValue) => ({
    ...optionValue,
    productOptionNames: optionNames.map((_, optionIndex) =>
      (optionValue.productOptionNames?.[optionIndex] || "").trim(),
    ),
  }));
};

const hasAtLeastOnePickedOption = (optionNames?: string[]) => {
  return (optionNames || []).some((name) => !!name?.trim());
};

const appendSelectionErrors = (errors: any) => {
  // Chỉ áp dụng "at least 1" khi đã có option attributes
  if (!variantOptionDefinitions.value.length) return;

  const optionValues = productForm.value.optionValues || [];
  optionValues.forEach((optionValue, index) => {
    if (hasAtLeastOnePickedOption(optionValue.productOptionNames)) return;
    errors.optionValues ||= [];
    errors.optionValues[index] ||= {};
    errors.optionValues[index].productOptionNames = ["Vui lòng chọn ít nhất 1 giá trị biến thể"];
  });
};

const onSubmit = async () => {
  try {
    loadingStates.value.upsert = true;
    syncVariantOptionsToForm();
    productForm.value.optionValues?.forEach((optionValue) => {
      if (typeof optionValue.code === "string") {
        const trimmedCode = optionValue.code.trim();
        optionValue.code = trimmedCode || undefined;
      }
    });
    const errors = validateProductForm(productForm.value);
    appendSelectionErrors(errors);

    // Duplicate check độc lập – không phụ thuộc vào errors mutation
    if (duplicateOptionValueIndexes.value.size > 0 || hasError(errors)) {
      formError.value = errors;
      return;
    }

    await uploadNewAsset();

    const response = await upsertProduct(productForm.value);
    if (response) {
      emits("on-upsert-product-success");
      modalRef.value?.closeModal();
    }
  } catch (error) {
    console.error(error);
  } finally {
    loadingStates.value.upsert = false;
  }
};

const onDeleteProduct = () => {
  deleteProduct(defaultData?._id!).then(() => {
    modalRef.value?.closeModal();
    emits("on-delete-product-success");
  });
};
// * Upload ảnh rồi thay đổi luôn ref image
const UPLOAD_PRESET_BY_TASK: Record<"image" | "thumbnail" | "option", TMediaCompressionPreset> = {
  image: "product",
  thumbnail: "thumbnail",
  option: "option",
};

const uploadNewAsset = async () => {
  const tasks: { type: "image" | "thumbnail" | "option"; ref: any }[] = [];
  const files: File[] = [];

  if (productForm.value.imageFiles) {
    productForm.value.imageFiles.forEach((file) => {
      files.push(file);
      tasks.push({ type: "image", ref: null });
    });
  }

  if (productForm.value.thumbnailFiles) {
    productForm.value.thumbnailFiles.forEach((file) => {
      files.push(file);
      tasks.push({ type: "thumbnail", ref: null });
    });
  }

  productForm.value.optionValues?.forEach((value) => {
    if (!value.imageFile?.length) return;
    value.imageFile.forEach((file) => {
      files.push(file);
      tasks.push({ type: "option", ref: value });
    });
  });

  if (!files.length) return;

  const compressedFiles = await Promise.all(
    files.map((file, index) => {
      const task = tasks[index];
      const preset = task ? UPLOAD_PRESET_BY_TASK[task.type] : "product";
      return compressImageFile(file, preset);
    }),
  );

  const uploadGroups = new Map<
    string,
    {
      preset: (typeof UPLOAD_PRESET_BY_TASK)[keyof typeof UPLOAD_PRESET_BY_TASK];
      indices: number[];
    }
  >();

  tasks.forEach((task, index) => {
    const preset = task ? UPLOAD_PRESET_BY_TASK[task.type] : "product";
    const group = uploadGroups.get(preset) ?? { preset, indices: [] };
    group.indices.push(index);
    uploadGroups.set(preset, group);
  });

  const urls = new Array<string>(files.length).fill("");

  await Promise.all(
    [...uploadGroups.values()].map(async ({ preset, indices }) => {
      const groupFiles = indices.map((index) => compressedFiles[index]!);
      const res = await $uploadRepository.uploadFiles(groupFiles, { preset });
      indices.forEach((index, groupIndex) => {
        urls[index] = res.data[groupIndex]?.url || "";
      });
    }),
  );

  let i = 0;
  tasks.forEach((task) => {
    if (task.type === "image") {
      productForm.value.imageUrls ||= [];
      productForm.value.imageUrls.push(urls[i]!);
    }

    if (task.type === "thumbnail") {
      productForm.value.thumbnailUrls ||= [];
      productForm.value.thumbnailUrls.push(urls[i]!);
    }

    if (task.type === "option") {
      task.ref.imageUrl = urls[i];
    }

    i++;
  });
};

const deleteOptionValue = (index: number) => {
  if (productForm.value.optionValues?.length === 1) {
    return;
  }
  productForm.value.optionValues?.splice(index, 1);
};

const removeProductOptionValue = (optionIndex: number) => {
  if (optionIndex < 0 || optionIndex >= productOptionValues.value.length) return;
  if (productOptionValues.value.length <= 1) return;
  productOptionValues.value.splice(optionIndex, 1);

  // Keep index alignment between productOptions and optionValues.productOptionNames
  productForm.value.optionValues = (productForm.value.optionValues || []).map((optionValue) => {
    const nextOptionNames = [...(optionValue.productOptionNames || [])];
    nextOptionNames.splice(optionIndex, 1);
    return {
      ...optionValue,
      productOptionNames: nextOptionNames,
    };
  });

  syncVariantOptionsToForm();
};

const toggleOptionValue = (rowIndex: number, optionIndex: number, optionValue: string) => {
  const row = productForm.value.optionValues?.[rowIndex];
  if (!row || !isEdit.value) return;

  const nextOptionNames = [...(row.productOptionNames || [])];
  nextOptionNames[optionIndex] = nextOptionNames[optionIndex] === optionValue ? "" : optionValue;
  row.productOptionNames = nextOptionNames;

  if (formError.value?.optionValues?.[rowIndex]?.productOptionNames) {
    formError.value.optionValues[rowIndex].productOptionNames = [];
  }
};

const isOptionPicked = (rowIndex: number, optionIndex: number, optionValue: string) => {
  return (
    productForm.value.optionValues?.[rowIndex]?.productOptionNames?.[optionIndex] === optionValue
  );
};

const getOptionValueError = (rowIndex: number) => {
  const error = formError.value?.optionValues?.[rowIndex]?.productOptionNames;
  if (Array.isArray(error)) {
    return error.filter(Boolean).join(", ");
  }
  return "";
};

const addThumbnailFiles = (files: File[]) => {
  if (!files.length) return;
  const nextFiles = [...(productForm.value.thumbnailFiles || []), ...files].slice(0, 5);
  productForm.value.thumbnailFiles = nextFiles;
};

const removeThumbnail = (index: number) => {
  const existingCount = (productForm.value.thumbnailUrls || []).length;
  if (index < existingCount) {
    productForm.value.thumbnailUrls?.splice(index, 1);
    return;
  }
  const fileIndex = index - existingCount;
  productForm.value.thumbnailFiles?.splice(fileIndex, 1);
};

const duplicateOptionValue = (index: number) => {
  const currentValue = productForm.value.optionValues?.[index];
  if (!currentValue || !productForm.value.optionValues) return;
  productForm.value.optionValues.splice(index + 1, 0, {
    ...currentValue,
    _id: undefined,
    code: "",
    imageFile: [],
    productOptionNames: [...(currentValue.productOptionNames || [])],
  });
};

const setOptionImageFile = (index: number, file: File | null) => {
  const option = productForm.value.optionValues?.[index];
  if (!option) return;
  option.imageFile = file ? [file] : [];
};

watchEffect(() => {
  if (defaultData) {
    console.log(defaultData);
    productForm.value = {
      ...defaultData,
      categoryIds: defaultData?.categoryIds || [],
      productOptions: defaultData?.productOptions || [],
      imageUrls: defaultData?.imageUrls || [],
      thumbnailUrls: defaultData?.thumbnailUrls || [],
      imageFiles: [],
      thumbnailFiles: [],
      optionValues: (defaultData?.optionValues || [createDefaultOptionValue()]).map((option) => ({
        ...option,
        imageFile: [],
      })),
    };
    productOptionValues.value = buildVariantOptionValues(defaultData);
  } else {
    productForm.value = {
      categoryIds: [],
      tagIds: [],
      productOptions: [],
      imageUrls: [],
      thumbnailUrls: [],
      imageFiles: [],
      thumbnailFiles: [],
      descriptionFrameId: null,
      optionValues: [createDefaultOptionValue()],
    };
    productOptionValues.value = [createOptionDef()];
  }

  if (!defaultData?._id) {
    isEdit.value = true;
  } else {
    isEdit.value = false;
  }

  formError.value = {};
});

watch(
  () => productForm.value.thumbnailFiles,
  (files) => {
    thumbnailPreviewUrls.value.forEach((url) => URL.revokeObjectURL(url));
    thumbnailPreviewUrls.value = (files || []).map((file) => URL.createObjectURL(file));
  },
  { deep: true },
);

onMounted(async () => {
  activeDescriptionFrames.value = await fetchActiveFrames();
});

onBeforeUnmount(() => {
  thumbnailPreviewUrls.value.forEach((url) => URL.revokeObjectURL(url));
});

defineExpose({
  openModal: () => modalRef.value?.openModal(),
});
</script>

<style scoped lang="scss">
.vcu-product-modal {
  table {
    td {
      vertical-align: middle;
    }
  }
}

.section-title {
  font-family: "Noto Serif", serif;
  border-left: 4px solid #8b0000;
  color: #5f0f0c;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
  padding-left: 12px;
}

.vcu-product-modal :deep(.space-y-1 > p.font-medium) {
  color: #5f514f;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
</style>
