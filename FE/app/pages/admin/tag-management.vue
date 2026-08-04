<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between mb-8">
      <h1 class="cms-title">Quản lý tag</h1>
      <AtomsButton type="primaryGradient" :icon="Plus" @click="openCreateModal">
        Thêm tag
      </AtomsButton>
    </div>

    <AtomsTable
      :columns="columns"
      :data="tags"
      :disable-row-select="true"
      :is-loading="loadingStates.fetch"
    >
      <template #icon="{ row }">
        <img
          v-if="row.icon"
          :src="row.icon"
          :alt="row.name"
          class="size-8 rounded object-cover border border-third-light/30"
        />
        <span v-else class="text-third-light text-xs">N/A</span>
      </template>

      <template #actions="{ row }">
        <div class="flex items-center gap-2">
          <AtomsButton type="outline" @click="openEditModal(Number(row._id))">Sửa</AtomsButton>
          <AtomsButton type="danger" @click="onDelete(Number(row._id))">Xóa</AtomsButton>
        </div>
      </template>
    </AtomsTable>

    <p v-if="!loadingStates.fetch && !fetchError && !tags.length" class="text-third-light text-sm">
      Không có tag nào để hiển thị.
    </p>

    <MoleculesCommonModal
      ref="tagModalRef"
      :header="formMode === 'create' ? 'Tạo tag mới' : 'Cập nhật tag'"
      :is-show-close="true"
      :close-on-click-overlay="false"
      :width="520"
      @on-close-modal="onCloseModal"
    >
      <div class="space-y-4">
        <AtomsFormItem label="Tên tag" :required="true" :error-message="formErrors.name">
          <AtomsFormInput
            v-model="tagForm.name"
            :error="formErrors.name"
            placeholder="Nhập tên tag"
          />
        </AtomsFormItem>

        <AtomsFormItem label="Icon URL" :error-message="formErrors.icon">
          <AtomsFormInput
            v-model="tagForm.icon"
            :error="formErrors.icon"
            placeholder="https://..."
          />
        </AtomsFormItem>

        <AtomsFormItem label="Order" :error-message="formErrors.order">
          <AtomsFormInput v-model="tagForm.order" :error="formErrors.order" placeholder="0" />
        </AtomsFormItem>
      </div>

      <template #footer>
        <AtomsButton type="outline" :disabled="loadingStates.upsert" @click="closeModal"
          >Hủy</AtomsButton
        >
        <AtomsButton type="primary" :is-loading="loadingStates.upsert" @click="submitForm">
          {{ formMode === "create" ? "Tạo mới" : "Cập nhật" }}
        </AtomsButton>
      </template>
    </MoleculesCommonModal>
  </div>
</template>

<script setup lang="ts">
import MoleculesCommonModal from "~/components/molecules/common/Modal.vue";
import useTag from "~/composables/tag.composable";
import type {
  TCreateTagPayload,
  TExistedTag,
  TTagFormError,
  TUpdateTagPayload,
} from "~/types/tag.type";
import type { TTableColumn } from "~/types/table.type";
import { Plus } from "lucide-vue-next";

type TTagForm = {
  id?: number;
  name: string;
  icon: string;
  order: string;
};

const toast = useToast();
const tagModalRef = ref<InstanceType<typeof MoleculesCommonModal>>();
const formMode = ref<"create" | "edit">("create");
const formErrors = ref<TTagFormError>({});

const tagForm = ref<TTagForm>({
  name: "",
  icon: "",
  order: "",
});

const {
  tags,
  fetchError,
  loadingStates,
  fetchTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
  validateTagForm,
} = useTag();

const columns = reactive<TTableColumn<TExistedTag>[]>([
  {
    title: "ID",
    key: "_id",
  },
  {
    title: "Name",
    key: "name",
  },
  {
    title: "Icon",
    key: "icon",
    slotKey: "icon",
  },
  {
    title: "Order",
    key: "order",
    render: (value) => Number(value ?? 0),
  },
  {
    title: "Actions",
    key: "actions",
    slotKey: "actions",
  },
]);

const resetForm = () => {
  tagForm.value = {
    name: "",
    icon: "",
    order: "",
  };
  formErrors.value = {};
};

const openCreateModal = () => {
  formMode.value = "create";
  resetForm();
  nextTick(() => tagModalRef.value?.openModal());
};

const openEditModal = async (id: number) => {
  formMode.value = "edit";
  formErrors.value = {};

  const tagDetail = await getTagById(id);
  if (!tagDetail) return;

  tagForm.value = {
    id: Number(tagDetail._id),
    name: tagDetail.name,
    icon: tagDetail.icon || "",
    order: String(tagDetail.order ?? ""),
  };

  nextTick(() => tagModalRef.value?.openModal());
};

const closeModal = () => {
  tagModalRef.value?.closeModal();
};

const onCloseModal = () => {
  resetForm();
};

const getFormPayload = (): {
  createPayload: TCreateTagPayload;
  updatePayload: TUpdateTagPayload;
} | null => {
  const parsedOrder =
    tagForm.value.order.trim() === "" ? undefined : Number(tagForm.value.order.trim());

  const createPayload: TCreateTagPayload = {
    name: tagForm.value.name.trim(),
    ...(tagForm.value.icon.trim() ? { icon: tagForm.value.icon.trim() } : {}),
    ...(parsedOrder !== undefined ? { order: parsedOrder } : {}),
  };

  const validationErrors = validateTagForm(createPayload);
  if (parsedOrder !== undefined && Number.isNaN(parsedOrder)) {
    validationErrors.order = "Order must be a number";
  }

  if (Object.keys(validationErrors).length) {
    formErrors.value = validationErrors;
    return null;
  }

  return {
    createPayload,
    updatePayload: createPayload,
  };
};

const submitForm = async () => {
  const payload = getFormPayload();
  if (!payload) return;

  let success = false;
  if (formMode.value === "create") {
    const created = await createTag(payload.createPayload);
    success = Boolean(created);
  } else {
    const tagId = tagForm.value.id;
    if (!tagId) {
      toast.error({ message: "Tag not found" });
      return;
    }

    const updated = await updateTag(tagId, payload.updatePayload);
    success = Boolean(updated);
  }

  if (success) {
    closeModal();
    await fetchTags();
  }
};

const onDelete = async (id: number) => {
  const confirmed = window.confirm("Bạn có chắc chắn muốn xóa tag này?");
  if (!confirmed) return;

  const success = await deleteTag(id);
  if (success) {
    await fetchTags();
  }
};

fetchTags();
</script>
