<template>
  <section class="space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <h1 class="cms-title">Quản lý danh mục</h1>

      <AtomsButton v-if="!loading" type="primaryGradient" :icon="Plus" @click="addCategory()">
        Thêm danh mục
      </AtomsButton>
    </div>

    <AtomsTable
      :columns="columns"
      :data="filteredCategories"
      :is-loading="loading"
      disable-row-select
    >
      <template #name="{ row }">
        <div
          class="font-semibold text-lg text-on-surface hover:text-primary cursor-pointer"
          @click="openCategoryDialog(row)"
        >
          {{ row.name }}
        </div>
      </template>

      <template #description="{ row }">
        <p class="line-clamp-1">{{ row.description || "Chưa có mô tả" }}</p>
      </template>

      <template #count="{ row }">
        <span
          class="inline-flex rounded-full px-3 py-1 bg-surface-container text-on-surface font-semibold"
        >
          {{ row.count || 0 }}
        </span>
      </template>

      <template #actions="{ row }">
        <div class="flex items-center gap-2">
          <AtomsButton
            type="ghost"
            circle
            class="w-9 h-9"
            :icon="Pencil"
            @click="openCategoryDialog(row, true)"
          />
          <AtomsButton
            type="ghost"
            circle
            class="w-9 h-9 text-danger"
            :icon="Trash2"
            @click="() => deleteCategory(row._id).then(() => onDeleteCategorySuccess())"
          />
        </div>
      </template>
    </AtomsTable>

    <MoleculesCommonModal
      ref="categoryModalRef"
      :header="modalHeader"
      :is-show-close="true"
      :width="700"
      :close-on-click-overlay="false"
      @on-close-modal="onCloseCategoryDialog"
    >
      <MoleculesVCUCategory
        v-if="selectedCategory"
        :default-is-edit="defaultIsEdit"
        class="w-full h-fit min-w-0"
        :category="selectedCategory"
        @on-upsert-category-success="onUpsertCategorySuccess"
        @on-delete-category-success="onDeleteCategorySuccess"
      />
    </MoleculesCommonModal>
  </section>
</template>

<script setup lang="ts">
import { Pencil, Plus, Trash2 } from "lucide-vue-next";
import type { TCategory, TExistedCategory } from "~/types/category.type";
import MoleculesCommonModal from "~/components/molecules/common/Modal.vue";
import type { TTableColumn } from "~/types/table.type";
import useCategory from "~/composables/category.composable";

const { categories, categoryCount, loading } = storeToRefs(useCategoryStore());
const { fetchCategories } = useCategoryStore();
const { deleteCategory } = useCategory();

const defaultIsEdit = ref(false);
const selectedCategory = ref<TCategory | null>(null);
const categoryModalRef = ref<InstanceType<typeof MoleculesCommonModal>>();

const openCategoryDialog = (category: TCategory, isEdit = false) => {
  selectedCategory.value = category;
  defaultIsEdit.value = isEdit;
  nextTick(() => {
    categoryModalRef.value?.openModal();
  });
};

const addCategory = () => {
  const newCategory: TCategory = {
    name: "Danh mục mới",
    slug: "",
  };
  openCategoryDialog(newCategory);
};

const onCloseCategoryDialog = () => {
  selectedCategory.value = null;
  defaultIsEdit.value = false;
};

const onUpsertCategorySuccess = () => {
  selectedCategory.value = null;
  categoryModalRef.value?.closeModal();
  fetchCategories();
};

const onDeleteCategorySuccess = () => {
  selectedCategory.value = null;
  categoryModalRef.value?.closeModal();
  fetchCategories();
};

const categoriesWithCount = computed(() =>
  categories.value.map((category) => ({
    ...category,
    count: categoryCount.value?.[category._id] || 0,
  })),
);

const filteredCategories = computed(() =>
  categoriesWithCount.value.filter((category: TExistedCategory) => !!category.name),
);

const columns = reactive<TTableColumn<TExistedCategory & { count: number }>[]>([
  { key: "name", title: "Tên danh mục", slotKey: "name", colClass: "w-[28%]" },
  { key: "slug", title: "Đường dẫn (slug)", colClass: "w-[20%]" },
  { key: "description", title: "Mô tả", slotKey: "description" },
  { key: "count", title: "Sản phẩm", slotKey: "count", colClass: "w-[12%]" },
  { key: "actions", title: "Hành động", slotKey: "actions", colClass: "w-[14%]" },
]);

const modalHeader = computed(() =>
  (selectedCategory.value as Partial<TExistedCategory> | null)?._id
    ? "Thông tin danh mục"
    : "Tạo mới danh mục",
);

onMounted(() => {
  fetchCategories();
});
</script>
