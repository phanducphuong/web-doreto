<template>
  <div class="space-y-4 sticky top-20">
    <!-- * TITLE -->
    <h3 class="text-lg font-semibold">{{ formLabel }}</h3>

    <!-- * FORM -->
    <div class="space-y-4">
      <!-- <MoleculesFilePicker
        v-model:files="categoryForm.iconUpload"
        :disabled="!isEdit"
        accept=".png,.webp,.jpg,.jpeg"
      /> -->

      <AtomsFormItem label="Tên danh mục" :required="true" :error-message="formError.name">
        <AtomsFormInput v-model="categoryForm.name" :disabled="!isEdit" :error="formError.name" />
      </AtomsFormItem>

      <AtomsFormItem
        label="Slug"
        :required="true"
        :disabled="!isEdit || category._id"
        :error-message="formError.slug"
        placeholder="Nhập slug"
      >
        <AtomsFormInput v-model="categoryForm.slug" :disabled="!isEdit" :error="formError.slug" />
      </AtomsFormItem>

      <!-- TODO: Order field -->
      <!-- <AtomsFormItem label="Thứ tự hiển thị" :error-message="formError.order">
        <AtomsFormInput
          v-model="categoryForm.order"
          :disabled="!isEdit"
          type="number"
          :min="ECategoryOrderLimit.MIN"
          :max="ECategoryOrderLimit.MAX"
          :error="formError.order"
        />
      </AtomsFormItem> -->

      <AtomsFormItem>
        <AtomsFormTextArea
          v-model="categoryForm.description"
          :disabled="!isEdit"
          :error="formError.description"
        />
      </AtomsFormItem>
    </div>

    <!-- * ACTIONS -->
    <div class="flex gap-4 items-center justify-end">
      <AtomsButton
        v-if="category._id"
        type="outline"
        class="mr-auto"
        :icon="FilePenLine"
        @click="isEdit = !isEdit"
      >
        Chỉnh sửa
      </AtomsButton>

      <template v-if="isEdit">
        <AtomsButton
          v-if="category._id"
          type="danger"
          :icon="Trash"
          :is-loading="loadingStates.delete"
          @click="
            deleteCategory(Number(category._id)).then(() => emits('on-delete-category-success'))
          "
        >
          Xóa
        </AtomsButton>
        <AtomsButton
          type="primary"
          :is-loading="loadingStates.upsert"
          :icon="Save"
          @click="onSubmit"
        >
          {{ category._id ? "Cập nhật" : "Tạo mới" }}
        </AtomsButton>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FilePenLine, Save, Trash } from "lucide-vue-next";
import useCategory from "~/composables/category.composable";
import { type TCategoryFormError, type TExistedCategory } from "~/types/category.type";

const { category, defaultIsEdit = false } = defineProps<{
  category: Partial<TExistedCategory>;
  defaultIsEdit?: boolean;
}>();

const { loadingStates, deleteCategory, upsertCategory, validateCategoryForm } = useCategory();
// const { $uploadRepository } = useNuxtApp();
const isEdit = ref(defaultIsEdit);
const categoryForm = ref<Partial<TExistedCategory>>({
  name: "",
  slug: "",
  // parentId: undefined,
  // icon: undefined,
  description: undefined,
  order: undefined,
  // iconUpload: undefined,
});

const formError = ref<TCategoryFormError>({});

const emits = defineEmits(["on-upsert-category-success", "on-delete-category-success"]);

// * METHODS
const onSubmit = async () => {
  const errors = validateCategoryForm(categoryForm.value);

  if (Object.keys(errors).length) {
    formError.value = errors;
    return;
  }

  // if (categoryForm.value.iconUpload) {
  //   try {
  //     const uploadResult = await $uploadRepository.uploadFiles(categoryForm.value.iconUpload);
  //     if (uploadResult.success) {
  //       categoryForm.value.icon = uploadResult.data?.[0]?.url || "";
  //     }
  //   } catch (error) {
  //     console.error("Failed to upload icon:", error);
  //     // Optionally, you can set an error message in formError here
  //     return;
  //   }
  // }

  const response = await upsertCategory({
    _id: category._id,
    ...categoryForm.value,
    // icon: categoryForm.value.icon || category.icon,
  });
  if (response) {
    emits("on-upsert-category-success");
  }
};

// * COMPUTED
const formLabel = computed(() => {
  if (category._id) {
    return isEdit.value ? "Cập nhật danh mục" : "Thông tin danh mục";
  }

  return "Tạo mới danh mục";
});

watchEffect(() => {
  if (category) {
    categoryForm.value = {
      name: category.name,
      slug: category.slug,
      // parentId: category.parentId,
      // icon: category.icon,
      order: category.order,
    };
  }

  if (!category._id) {
    isEdit.value = defaultIsEdit || true;
  } else {
    isEdit.value = defaultIsEdit || false;
  }
});
</script>
