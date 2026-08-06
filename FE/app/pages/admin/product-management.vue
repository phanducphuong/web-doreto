<template>
  <section class="space-y-6">
    <div class="mb-5 flex flex-wrap items-start justify-between gap-4">
      <h1 class="cms-title">Quản lý sản phẩm</h1>

      <AtomsButton type="primaryGradient" :icon="Plus" @click="openDetailProductModal">
        Thêm sản phẩm
      </AtomsButton>
    </div>

    <div class="flex flex-col gap-4">
      <MoleculesAdminProductFilter :tags="tags" />
      <div class="flex justify-end">
        <p class="text-xs text-outline">
          Hiển thị {{ listProducts.length }} / {{ pagination?.total ?? listProducts.length }} sản
          phẩm
        </p>
      </div>
      <AtomsTable
        :columns="columns"
        :data="listProducts"
        :pagination="pagination"
        :is-loading="isFetching"
        @change="onPageChange"
        @select-record="openDetailProductModal"
      >
        <template #name="{ row }">
          <NuxtLink
            :to="`/san-pham/${generateProductSlug(row)}`"
            class="text-primary hover:underline"
            @click.stop
          >
            {{ row.name }}
          </NuxtLink>
        </template>
        <template #categoryIds="{ row }">
          {{
            row.categoryIds.map((id) => categories.find((cate) => cate._id === id)?.name).join(",")
          }}
        </template>

        <template #tagIds="{ row }">
          {{ row.tagIds.map((id) => tags.find((tag) => tag._id === id)?.name).join(",") }}
        </template>

        <template #purchaseCount="{ row }">
          <div class="space-y-0.5">
            <p class="font-medium text-on-surface">{{ getDisplayPurchaseCount(row) }}</p>
            <p class="text-xs text-on-surface-variant">
              Thật {{ row.purchaseCount ?? 0 }} · Ảo {{ row.virtualPurchaseCount ?? 0 }}
            </p>
          </div>
        </template>

        <template #actions="{ row }">
          <div class="flex flex-wrap items-center gap-2" @click.stop>
            <AtomsButton
              type="outline"
              class="min-h-8 text-xs whitespace-nowrap"
              @click="openVirtualPurchaseModal(row)"
            >
              Tăng lượt mua
            </AtomsButton>
            <AtomsButton
              type="outline"
              class="min-h-8 text-xs whitespace-nowrap"
              @click="openFeedbackManagerModal(row)"
            >
              Đánh giá
            </AtomsButton>
          </div>
        </template>
      </AtomsTable>

      <MoleculesVCUProduct
        ref="vcuProductRef"
        :default-data="selectedProduct"
        :tags="tags"
        @on-close-modal="selectedProduct = undefined"
        @on-upsert-product-success="onUpsertProductSuccess"
        @on-delete-product-success="onDeleteProductSuccess"
      />

      <MoleculesProductAdminVirtualPurchaseCountModal
        ref="virtualPurchaseModalRef"
        :submitting="isSavingVirtualPurchase"
        @submit="onSubmitVirtualPurchase"
      />

      <MoleculesFeedbackAdminProductFeedbackManagerModal
        ref="feedbackModalRef"
        @changed="onFeedbackChanged"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import useProduct from "~/composables/product.composable";
import type { TExistedProduct, TProductQueryParams } from "~/types/product.type";
import type { TTableColumn } from "~/types/table.type";
import MoleculesVCUProduct from "~/components/molecules/VCUProduct.vue";
import MoleculesAdminProductFilter from "~/components/molecules/AdminProductFilter.vue";
import MoleculesProductAdminVirtualPurchaseCountModal from "~/components/molecules/product/AdminVirtualPurchaseCountModal.vue";
import MoleculesFeedbackAdminProductFeedbackManagerModal from "~/components/molecules/feedback/AdminProductFeedbackManagerModal.vue";
import { getDisplayPurchaseCount } from "~/utils/product.utils";
import { getApiErrorMessage } from "~/utils/api-error";
import useTag from "~/composables/tag.composable";
import { Plus } from "lucide-vue-next";

const route = useRoute();
const { updateQuery } = useUpdateRouteQuery();
const { listProducts, fetchProducts, pagination, isFetching } = useProduct();
const { $productRepository } = useNuxtApp();
const toast = useToast();

const vcuProductRef = ref<InstanceType<typeof MoleculesVCUProduct>>();
const virtualPurchaseModalRef =
  ref<InstanceType<typeof MoleculesProductAdminVirtualPurchaseCountModal>>();
const feedbackModalRef =
  ref<InstanceType<typeof MoleculesFeedbackAdminProductFeedbackManagerModal>>();

const { categories } = storeToRefs(useCategoryStore());
const { tags, fetchTags } = useTag();

const isSavingVirtualPurchase = ref(false);

const params = computed<TProductQueryParams>(() => ({
  ...route.query,
  minPrice: parseNumber(route.query.minPrice),
  maxPrice: parseNumber(route.query.maxPrice),
  page: parseNumber(route.query.page, 1),
  limit: parseNumber(route.query.limit, 10),
}));

const columns = reactive<TTableColumn<TExistedProduct>[]>([
  {
    key: "name",
    title: "Tên sản phẩm",
    slotKey: "name",
  },
  {
    key: "price",
    title: "Giá",
    render: (_, record) => {
      const minPrice = record.minPrice || 0;
      const maxPrice = record.maxPrice || 0;

      return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
    },
  },
  {
    key: "stock",
    title: "Số lượng còn hàng",
  },
  {
    key: "purchaseCount",
    title: "Lượt mua hiển thị",
    slotKey: "purchaseCount",
  },
  {
    key: "categoryIds",
    title: "Danh mục",
    slotKey: "categoryIds",
    colClass: "w-[20%]",
  },
  {
    key: "tagIds",
    title: "Tag",
    slotKey: "tagIds",
  },
  {
    key: "actions",
    title: "Thao tác",
    slotKey: "actions",
    colClass: "w-[14%]",
  },
]);

const selectedProduct = ref<TExistedProduct | undefined>();

const openDetailProductModal = (data?: TExistedProduct) => {
  selectedProduct.value = data;
  nextTick(() => {
    vcuProductRef.value?.openModal();
  });
};

const openVirtualPurchaseModal = (product: TExistedProduct) => {
  virtualPurchaseModalRef.value?.openModal(product);
};

const openFeedbackManagerModal = (product: TExistedProduct) => {
  if (!product._id) return;
  feedbackModalRef.value?.openModal({
    id: product._id,
    name: product.name,
  });
};

const onSubmitVirtualPurchase = async (payload: {
  productId: number;
  virtualPurchaseCount: number;
}) => {
  try {
    isSavingVirtualPurchase.value = true;
    await $productRepository.updateVirtualPurchaseCount(
      payload.productId,
      payload.virtualPurchaseCount,
    );
    virtualPurchaseModalRef.value?.closeModal();
    toast.success({ message: "Cập nhật lượt mua ảo thành công." });
    await fetchProducts(params.value);
  } catch (error) {
    const message = getApiErrorMessage(error, "Cập nhật lượt mua ảo thất bại.");
    virtualPurchaseModalRef.value?.setError(message);
    toast.error({ message });
  } finally {
    isSavingVirtualPurchase.value = false;
  }
};

// Sau khi thêm/sửa/xóa đánh giá: làm mới danh sách để cập nhật số sao hiển thị
const onFeedbackChanged = () => {
  fetchProducts(params.value);
};

const onPageChange = (page: number) => {
  updateQuery({ page });
  fetchProducts(params.value);
};

const onUpsertProductSuccess = () => {
  fetchProducts(params.value);
};

const onDeleteProductSuccess = () => {
  fetchProducts(params.value);
};

watch(
  () => route.query,
  () => {
    fetchProducts(params.value);
  },
  { immediate: true },
);

onMounted(() => {
  fetchTags();
});
</script>
