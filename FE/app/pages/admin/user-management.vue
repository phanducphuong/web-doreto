<template>
  <section class="space-y-6">
    <div class="flex items-center justify-between gap-4">
      <h1 class="cms-title">Quản lý người dùng</h1>
    </div>

    <div
      class="flex flex-wrap items-end gap-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4"
    >
      <AtomsFormItem label="Tìm kiếm" class="min-w-72 flex-1">
        <AtomsFormInput
          v-model="keywordInput"
          placeholder="Tìm theo tên, email, số điện thoại..."
          @keyup.enter="applyKeywordFilter"
        />
      </AtomsFormItem>

      <AtomsFormItem label="Sắp xếp theo">
        <AtomsFormSelectBox
          v-model="sortByFilter"
          :options="sortByOptions"
          placeholder="Mặc định"
          class="min-w-44"
        />
      </AtomsFormItem>

      <AtomsFormItem label="Thứ tự">
        <AtomsFormSelectBox
          v-model="sortOrderFilter"
          :options="sortOrderOptions"
          placeholder="Mặc định"
          class="min-w-36"
        />
      </AtomsFormItem>

      <AtomsButton type="outline" :disabled="isFetching" @click="applyKeywordFilter"
        >Lọc</AtomsButton
      >
      <AtomsButton type="ghost" :disabled="isFetching" @click="resetFilters">Đặt lại</AtomsButton>
    </div>

    <AtomsUiInlineError :message="pageError" />

    <AtomsTable
      :columns="columns"
      :data="users"
      :pagination="pagination"
      :is-loading="isFetching"
      disable-row-select
      @change="onPageChange"
    >
      <template #avatar="{ row }">
        <div class="flex items-center justify-center">
          <NuxtImg
            v-if="row.avatarUrl"
            :src="row.avatarUrl"
            :width="40"
            :height="40"
            class="size-10 rounded-full border border-outline-variant object-cover"
          />
          <div
            v-else
            class="size-10 rounded-full border border-outline-variant center-child text-xs text-outline"
          >
            N/A
          </div>
        </div>
      </template>

      <template #createdAt="{ row }">
        <p class="text-sm text-on-surface-variant">{{ formatIsoDateTime(row.createdAt || "") }}</p>
      </template>

      <template #actions="{ row }">
        <div class="flex items-center gap-2" @click.stop>
          <AtomsButton
            type="outline"
            :disabled="isFetchingDetail || isUpdating"
            @click="openEditModal(row._id)"
          >
            Sửa
          </AtomsButton>
        </div>
      </template>
    </AtomsTable>

    <MoleculesCommonModal
      ref="editModalRef"
      header="Cập nhật thông tin người dùng"
      :is-show-close="true"
      :close-on-click-overlay="false"
      :width="560"
      @on-close-modal="onCloseModal"
    >
      <div class="space-y-4">
        <AtomsUiInlineError :message="detailError" />

        <AtomsFormItem label="Họ tên">
          <AtomsFormInput v-model="editForm.name" placeholder="Nhập họ tên" />
        </AtomsFormItem>

        <AtomsFormItem label="Số điện thoại">
          <AtomsFormInput v-model="editForm.phoneNumber" placeholder="Nhập số điện thoại" />
        </AtomsFormItem>

        <AtomsFormItem label="Avatar URL">
          <AtomsFormInput v-model="editForm.avatarUrl" placeholder="https://..." />
        </AtomsFormItem>
      </div>

      <template #footer>
        <AtomsButton type="outline" :disabled="isUpdating" @click="closeModal">Hủy</AtomsButton>
        <AtomsButton
          type="primary"
          :is-loading="isUpdating"
          :disabled="isFetchingDetail"
          @click="submitUpdate"
        >
          Lưu thay đổi
        </AtomsButton>
      </template>
    </MoleculesCommonModal>
  </section>
</template>

<script setup lang="ts">
import MoleculesCommonModal from "~/components/molecules/common/Modal.vue";
import type { TTableColumn, TTablePagination } from "~/types/table.type";
import type { TUser, TUserManagementItem, TUserManagementQueryParams } from "~/types/user.type";
import { getApiErrorMessage } from "~/utils/api-error";

const route = useRoute();
const { updateQuery } = useUpdateRouteQuery();
const { $userManagementRepository } = useNuxtApp();
const toast = useToast();

const users = ref<TUserManagementItem[]>([]);
const isFetching = ref(false);
const isFetchingDetail = ref(false);
const isUpdating = ref(false);
const pageError = ref("");
const detailError = ref("");
const editModalRef = ref<InstanceType<typeof MoleculesCommonModal>>();

const pagination = ref<TTablePagination>({
  page: 1,
  totalPage: 0,
  total: 0,
  count: 0,
});

const selectedUserId = ref<string | number | null>(null);
const keywordInput = ref("");
const sortByFilter = ref<"" | TUserManagementQueryParams["sortBy"]>("");
const sortOrderFilter = ref<"" | TUserManagementQueryParams["sortOrder"]>("");

const sortByOptions = [
  { label: "Mặc định", value: "" },
  { label: "Tên", value: "name" },
  { label: "Email", value: "email" },
  { label: "Số điện thoại", value: "phoneNumber" },
  { label: "Ngày tạo", value: "createdAt" },
];

const sortOrderOptions = [
  { label: "Mặc định", value: "" },
  { label: "Tăng dần", value: "asc" },
  { label: "Giảm dần", value: "desc" },
];

const editForm = reactive({
  name: "",
  phoneNumber: "",
  avatarUrl: "",
});

const columns = reactive<TTableColumn<TUserManagementItem>[]>([
  { key: "avatar", title: "Avatar", slotKey: "avatar", center: true, colClass: "w-24" },
  { key: "name", title: "Họ tên", colClass: "w-[20%]" },
  { key: "email", title: "Email", colClass: "w-[24%]" },
  { key: "phoneNumber", title: "Số điện thoại", colClass: "w-[18%]" },
  { key: "createdAt", title: "Ngày tạo", slotKey: "createdAt", colClass: "w-[18%]" },
  { key: "actions", title: "Thao tác", slotKey: "actions", colClass: "w-[12%]" },
]);

const queryParams = computed<TUserManagementQueryParams>(() => ({
  page: parseNumber(route.query.page, 1),
  limit: parseNumber(route.query.limit, 20),
  keyword: typeof route.query.keyword === "string" ? route.query.keyword : undefined,
  sortBy:
    typeof route.query.sortBy === "string" &&
    ["name", "email", "phoneNumber", "createdAt"].includes(route.query.sortBy)
      ? (route.query.sortBy as TUserManagementQueryParams["sortBy"])
      : undefined,
  sortOrder:
    route.query.sortOrder === "asc" || route.query.sortOrder === "desc"
      ? (route.query.sortOrder as TUserManagementQueryParams["sortOrder"])
      : undefined,
}));

const syncFilterFromRoute = () => {
  keywordInput.value = queryParams.value.keyword || "";
  sortByFilter.value = queryParams.value.sortBy || "";
  sortOrderFilter.value = queryParams.value.sortOrder || "";
};

const mapErrorMessage = (error: unknown, fallback: string) => {
  const message = getApiErrorMessage(error, fallback);
  if (/phone.*exist|phone.*duplicate|số điện thoại.*tồn tại/i.test(message)) {
    return "Số điện thoại đã tồn tại.";
  }
  if (/user.*not found|người dùng.*không tồn tại/i.test(message)) {
    return "Người dùng không tồn tại.";
  }
  return message;
};

const fetchUsers = async () => {
  try {
    isFetching.value = true;
    pageError.value = "";
    const response = await $userManagementRepository.getManagementUsers(queryParams.value);
    users.value = response.data;
    pagination.value = {
      page: response.page,
      totalPage: response.totalPages,
      total: response.total,
      count: response.limit,
    };
  } catch (error) {
    const message = mapErrorMessage(error, "Không thể tải danh sách người dùng.");
    pageError.value = message;
    users.value = [];
    toast.error({ message });
  } finally {
    isFetching.value = false;
  }
};

const applyKeywordFilter = () => {
  updateQuery({
    page: 1,
    keyword: keywordInput.value.trim() || undefined,
  });
};

const resetFilters = () => {
  keywordInput.value = "";
  sortByFilter.value = "";
  sortOrderFilter.value = "";
  updateQuery({
    page: 1,
    keyword: undefined,
    sortBy: undefined,
    sortOrder: undefined,
  });
};

const onPageChange = (page: number) => {
  updateQuery({ page });
};

const openEditModal = async (id: string | number) => {
  try {
    selectedUserId.value = id;
    isFetchingDetail.value = true;
    detailError.value = "";
    const user = await $userManagementRepository.getUserById(id);
    editForm.name = user.name || "";
    editForm.phoneNumber = user.phoneNumber || "";
    editForm.avatarUrl = user.avatarUrl || "";
    nextTick(() => editModalRef.value?.openModal());
  } catch (error) {
    const message = mapErrorMessage(error, "Không thể tải chi tiết người dùng.");
    toast.error({ message });
  } finally {
    isFetchingDetail.value = false;
  }
};

const closeModal = () => {
  editModalRef.value?.closeModal();
};

const onCloseModal = () => {
  selectedUserId.value = null;
  detailError.value = "";
  editForm.name = "";
  editForm.phoneNumber = "";
  editForm.avatarUrl = "";
};

const submitUpdate = async () => {
  if (!selectedUserId.value) return;
  try {
    isUpdating.value = true;
    detailError.value = "";
    const response = await $userManagementRepository.updateUserById(selectedUserId.value, {
      name: editForm.name.trim(),
      phoneNumber: editForm.phoneNumber.trim(),
      avatarUrl: editForm.avatarUrl.trim(),
    });
    toast.success({ message: "Cập nhật người dùng thành công." });
    closeModal();

    const idx = users.value.findIndex((u) => String(u._id) === String(selectedUserId.value));
    if (idx !== -1) {
      users.value[idx] = {
        ...users.value[idx],
        name: response.name,
        phoneNumber: response.phoneNumber,
        avatarUrl: response.avatarUrl,
      } as any;
    } else {
      fetchUsers();
    }
  } catch (error) {
    detailError.value = mapErrorMessage(error, "Cập nhật người dùng thất bại.");
  } finally {
    isUpdating.value = false;
  }
};

watch(
  () => route.query,
  () => {
    syncFilterFromRoute();
    fetchUsers();
  },
  { immediate: true },
);

watch([sortByFilter, sortOrderFilter], () => {
  updateQuery({
    page: 1,
    sortBy: sortByFilter.value || undefined,
    sortOrder: sortOrderFilter.value || undefined,
  });
});
</script>
