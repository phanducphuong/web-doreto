<template>
  <AtomsAdminFilter v-model="filterValues" :filters="filterConfigs" :form-errors="formErrors" />
</template>

<script setup lang="ts">
import AtomsAdminFilter, { type FilterConfig } from "../atoms/AdminFilter.vue";
import { ref } from "vue";
import { useRoute } from "vue-router";
import type { TExistedTag } from "~/types/tag.type";

const props = defineProps<{
  tags: TExistedTag[];
}>();

const { categories } = storeToRefs(useCategoryStore());
const { updateQuery } = useUpdateRouteQuery();

const route = useRoute();

// Filter configuration
const filterConfigs = computed<FilterConfig[]>(() => [
  {
    type: "input",
    placeholder: "Tìm kiếm ID hoặc tên sản phẩm...",
    key: "keyword",
  },
  {
    type: "select",
    options: categories.value.map((category) => ({
      label: category.name,
      value: category._id,
    })),
    placeholder: "Chọn danh mục",
    key: "categoryId",
  },
  {
    type: "select",
    options: props.tags.map((tag) => ({
      label: tag.name,
      value: tag._id,
    })),
    placeholder: "Chọn tag",
    key: "tagId",
  },
  {
    type: "price",
    placeholder: "Giá thấp nhất",
    key: "minPrice",
  },
  {
    type: "price",
    placeholder: "Giá cao nhất",
    key: "maxPrice",
  },
  {
    type: "select",
    options: [
      {
        value: "price",
        label: "Giá",
      },
      {
        value: "purchaseCount",
        label: "Lượt mua",
      },
      {
        value: "updatedAt",
        label: "Thời gian cập nhật",
      },
    ],
    placeholder: "Sắp xếp theo",
    key: "sortBy",
  },
  {
    type: "select",
    options: [
      {
        value: "asc",
        label: "Tăng dần",
      },
      {
        value: "desc",
        label: "Giảm dần",
      },
    ],
    placeholder: "Thứ tự",
    key: "sortOrder",
  },
]);

// Filter values (v-model)
const filterValues = ref({
  search: "",
  category: "",
  minPrice: "",
  maxPrice: "",
});

// Form errors (optional)
const formErrors = ref({
  minPrice: "",
  maxPrice: "",
});

watch(
  filterValues,
  (newVal) => {
    const params: Partial<typeof newVal> = {
      ...newVal,
    };
    if (getSafeNumber(newVal?.minPrice) === 0) params.minPrice = "";
    if (getSafeNumber(newVal?.maxPrice) === 0) params.maxPrice = "";
    updateQuery(params);
  },
  { deep: true },
);

onMounted(() => {
  Object.assign(filterValues.value, route.query);
});
</script>
