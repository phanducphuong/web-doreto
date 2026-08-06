<template>
  <div class="space-y-4">
    <div class="mb-8 flex items-center justify-between">
      <h1 class="cms-title">Quản lý khung ảnh</h1>
      <AtomsButton type="primaryGradient" :icon="Plus" @click="openCreateModal">
        Thêm khung
      </AtomsButton>
    </div>

    <AtomsTable
      :columns="columns"
      :data="frames"
      :disable-row-select="true"
      :is-loading="loadingStates.fetch"
    >
      <template #preview="{ row }">
        <img
          :src="row.imageUrl"
          :alt="row.name"
          class="size-12 rounded object-contain border border-third-light/30 bg-surface-container-low p-0.5"
        />
      </template>

      <template #inset="{ row }">
        <span class="text-xs text-on-surface-variant">
          {{ row.insetTop ?? 0 }}/{{ row.insetRight ?? 0 }}/{{ row.insetBottom ?? 0 }}/{{
            row.insetLeft ?? 0
          }}
        </span>
      </template>

      <template #isActive="{ row }">
        <span
          class="rounded-full px-2 py-0.5 text-xs font-medium"
          :class="row.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
        >
          {{ row.isActive ? "Active" : "Inactive" }}
        </span>
      </template>

      <template #actions="{ row }">
        <div class="flex items-center gap-2">
          <AtomsButton type="outline" @click="openEditModal(Number(row._id))">Sửa</AtomsButton>
          <AtomsButton type="danger" @click="onDelete(Number(row._id))">Khóa</AtomsButton>
        </div>
      </template>
    </AtomsTable>

    <p
      v-if="!loadingStates.fetch && !fetchError && !frames.length"
      class="text-third-light text-sm"
    >
      Chưa có khung ảnh nào.
    </p>

    <MoleculesCommonModal
      ref="frameModalRef"
      :header="formMode === 'create' ? 'Tạo khung ảnh' : 'Cập nhật khung ảnh'"
      :is-show-close="true"
      :close-on-click-overlay="false"
      :width="720"
      @on-close-modal="onCloseModal"
    >
      <div class="space-y-4">
        <AtomsFormItem label="Tên khung" :required="true" :error-message="formErrors.name">
          <AtomsFormInput
            v-model="frameForm.name"
            :error="formErrors.name"
            placeholder="Khung gỗ sáng"
          />
        </AtomsFormItem>

        <AtomsFormItem label="Ảnh khung" :required="true" :error-message="formErrors.imageUrl">
          <AtomsSingleImagePicker
            :file="frameImageFile"
            :image-url="frameForm.imageUrl"
            :accept="FRAME_IMAGE_ACCEPT"
            @update:file="onFrameImageSelected"
          />
        </AtomsFormItem>

        <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
          <AtomsFormItem label="Inset top (%)" :error-message="formErrors.insetTop">
            <AtomsFormInput v-model="frameForm.insetTop" placeholder="0" />
          </AtomsFormItem>
          <AtomsFormItem label="Inset right (%)" :error-message="formErrors.insetRight">
            <AtomsFormInput v-model="frameForm.insetRight" placeholder="0" />
          </AtomsFormItem>
          <AtomsFormItem label="Inset bottom (%)" :error-message="formErrors.insetBottom">
            <AtomsFormInput v-model="frameForm.insetBottom" placeholder="0" />
          </AtomsFormItem>
          <AtomsFormItem label="Inset left (%)" :error-message="formErrors.insetLeft">
            <AtomsFormInput v-model="frameForm.insetLeft" placeholder="0" />
          </AtomsFormItem>
        </div>
        <p class="text-xs text-on-surface-variant">
          Khung viền mỏng: để inset = 0. Tăng inset khi cần thu nhỏ vùng ảnh gốc bên trong khung.
        </p>

        <AtomsFormItem label="Thứ tự" :error-message="formErrors.sortOrder">
          <AtomsFormInput v-model="frameForm.sortOrder" placeholder="0" />
        </AtomsFormItem>

        <AtomsFormItem label="Trạng thái">
          <label class="inline-flex items-center gap-2 text-sm">
            <input v-model="frameForm.isActive" type="checkbox" class="size-4" />
            Đang hoạt động
          </label>
        </AtomsFormItem>

        <div
          v-if="previewFrame"
          class="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
        >
          <p class="mb-3 text-sm font-medium text-on-surface">Xem trước vùng ảnh gốc</p>
          <AtomsImageFrameInsetPreview :frame="previewFrame" />
        </div>
      </div>

      <template #footer>
        <AtomsButton
          type="outline"
          :disabled="loadingStates.upsert || isUploading"
          @click="closeModal"
        >
          Hủy
        </AtomsButton>
        <AtomsButton
          type="primary"
          :is-loading="loadingStates.upsert || isUploading"
          @click="submitForm"
        >
          {{ formMode === "create" ? "Tạo mới" : "Cập nhật" }}
        </AtomsButton>
      </template>
    </MoleculesCommonModal>
  </div>
</template>

<script setup lang="ts">
import MoleculesCommonModal from "~/components/molecules/common/Modal.vue";
import useImageFrame from "~/composables/image-frame.composable";
import type {
  TActiveImageFrame,
  TCreateImageFramePayload,
  TExistedImageFrame,
  TImageFrameFormError,
  TUpdateImageFramePayload,
} from "~/types/image-frame.type";
import type { TTableColumn } from "~/types/table.type";
import { DEFAULT_FRAME_INSET, FRAME_IMAGE_ACCEPT } from "~/utils/image-frame.utils";
import { Plus } from "lucide-vue-next";

type TFrameForm = {
  id?: number;
  name: string;
  imageUrl: string;
  insetTop: string;
  insetRight: string;
  insetBottom: string;
  insetLeft: string;
  sortOrder: string;
  isActive: boolean;
};

const toast = useToast();
const { uploadFiles, isUploading } = useUploadFiles();
const frameModalRef = ref<InstanceType<typeof MoleculesCommonModal>>();
const formMode = ref<"create" | "edit">("create");
const formErrors = ref<TImageFrameFormError>({});
const frameImageFile = ref<File | null>(null);

const frameForm = ref<TFrameForm>({
  name: "",
  imageUrl: "",
  insetTop: String(DEFAULT_FRAME_INSET),
  insetRight: String(DEFAULT_FRAME_INSET),
  insetBottom: String(DEFAULT_FRAME_INSET),
  insetLeft: String(DEFAULT_FRAME_INSET),
  sortOrder: "0",
  isActive: true,
});

const {
  frames,
  fetchError,
  loadingStates,
  fetchFrames,
  getFrameById,
  createFrame,
  updateFrame,
  deleteFrame,
  validateImageFrameForm,
} = useImageFrame();

const columns = reactive<TTableColumn<TExistedImageFrame>[]>([
  { title: "ID", key: "_id" },
  { title: "Tên", key: "name" },
  { title: "Preview", key: "imageUrl", slotKey: "preview" },
  { title: "Inset T/R/B/L", key: "insetTop", slotKey: "inset" },
  { title: "Sort", key: "sortOrder", render: (value) => Number(value ?? 0) },
  { title: "Trạng thái", key: "isActive", slotKey: "isActive" },
  { title: "Actions", key: "actions", slotKey: "actions" },
]);

const previewFrame = computed<TActiveImageFrame | null>(() => {
  if (!frameForm.value.imageUrl.trim()) return null;

  return {
    _id: frameForm.value.id ?? 0,
    name: frameForm.value.name || "Preview",
    imageUrl: frameForm.value.imageUrl.trim(),
    insetTop: parseInset(frameForm.value.insetTop),
    insetRight: parseInset(frameForm.value.insetRight),
    insetBottom: parseInset(frameForm.value.insetBottom),
    insetLeft: parseInset(frameForm.value.insetLeft),
    sortOrder: Number(frameForm.value.sortOrder || 0),
  };
});

function parseInset(value: string) {
  const parsed = Number(value.trim());
  return Number.isNaN(parsed) ? DEFAULT_FRAME_INSET : parsed;
}

const resetForm = () => {
  frameForm.value = {
    name: "",
    imageUrl: "",
    insetTop: String(DEFAULT_FRAME_INSET),
    insetRight: String(DEFAULT_FRAME_INSET),
    insetBottom: String(DEFAULT_FRAME_INSET),
    insetLeft: String(DEFAULT_FRAME_INSET),
    sortOrder: "0",
    isActive: true,
  };
  frameImageFile.value = null;
  formErrors.value = {};
};

const openCreateModal = () => {
  formMode.value = "create";
  resetForm();
  nextTick(() => frameModalRef.value?.openModal());
};

const openEditModal = async (id: string) => {
  formMode.value = "edit";
  formErrors.value = {};

  const detail = await getFrameById(id);
  if (!detail) return;

  frameForm.value = {
    id: Number(detail._id),
    name: detail.name,
    imageUrl: detail.imageUrl,
    insetTop: String(detail.insetTop ?? DEFAULT_FRAME_INSET),
    insetRight: String(detail.insetRight ?? DEFAULT_FRAME_INSET),
    insetBottom: String(detail.insetBottom ?? DEFAULT_FRAME_INSET),
    insetLeft: String(detail.insetLeft ?? DEFAULT_FRAME_INSET),
    sortOrder: String(detail.sortOrder ?? 0),
    isActive: detail.isActive,
  };
  frameImageFile.value = null;

  nextTick(() => frameModalRef.value?.openModal());
};

const closeModal = () => {
  frameModalRef.value?.closeModal();
};

const onCloseModal = () => {
  resetForm();
};

const uploadFile = async (file: File | null) => {
  if (!file) return null;
  try {
    const [url] = await uploadFiles([file], { preset: "description" });
    return url || null;
  } catch {
    toast.error({ message: "Upload ảnh thất bại" });
    return null;
  }
};

const onFrameImageSelected = async (file: File | null) => {
  frameImageFile.value = file;
  if (!file) return;
  const url = await uploadFile(file);
  if (url) frameForm.value.imageUrl = url;
};

const getFormPayload = (): {
  createPayload: TCreateImageFramePayload;
  updatePayload: TUpdateImageFramePayload;
} | null => {
  const createPayload: TCreateImageFramePayload = {
    name: frameForm.value.name.trim(),
    imageUrl: frameForm.value.imageUrl.trim(),
    insetTop: parseInset(frameForm.value.insetTop),
    insetRight: parseInset(frameForm.value.insetRight),
    insetBottom: parseInset(frameForm.value.insetBottom),
    insetLeft: parseInset(frameForm.value.insetLeft),
    sortOrder: Number(frameForm.value.sortOrder || 0),
    isActive: frameForm.value.isActive,
  };

  const validationErrors = validateImageFrameForm(createPayload);
  if (Number.isNaN(createPayload.sortOrder!)) {
    validationErrors.sortOrder = "Sort order phải là số >= 0";
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
    success = Boolean(await createFrame(payload.createPayload));
  } else {
    const frameId = frameForm.value.id;
    if (!frameId) {
      toast.error({ message: "Không tìm thấy khung ảnh" });
      return;
    }
    success = Boolean(await updateFrame(frameId, payload.updatePayload));
  }

  if (success) {
    closeModal();
    await fetchFrames();
  }
};

const onDelete = async (id: string) => {
  const confirmed = window.confirm(
    "Vô hiệu hóa khung này? Các sản phẩm đang dùng khung sẽ bỏ khung mặc định.",
  );
  if (!confirmed) return;

  const success = await deleteFrame(id);
  if (success) {
    await fetchFrames();
  }
};

fetchFrames();
</script>
