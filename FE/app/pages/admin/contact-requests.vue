<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <h1 class="cms-title">Yêu cầu liên hệ</h1>

      <div class="mb-4 flex flex-wrap items-center gap-2">
        <AtomsButton
          v-for="opt in doneFilterOptions"
          :key="opt.value"
          :type="doneFilter === opt.value ? 'primary' : 'outline'"
          class="min-h-9"
          :disabled="isFetching"
          @click="setDoneFilter(opt.value)"
        >
          {{ opt.label }}
        </AtomsButton>
      </div>
    </div>

    <AtomsTable
      :columns="columns"
      :data="listContacts"
      :pagination="pagination"
      disable-row-select
      @change="onPageChange"
    >
      <template #actions="{ row }">
        <div class="flex flex-wrap items-center gap-2" @click.stop>
          <AtomsButton
            :type="row.done ? 'primary' : 'outline'"
            class="min-h-8 text-xs"
            :disabled="isFetching"
            :icon="row.done ? History : Check"
            @click="toggleDone(row)"
          >
            {{ row.done ? "Hoàn tác" : "Hoàn thành" }}
          </AtomsButton>
          <AtomsButton
            type="danger"
            class="min-h-8 text-xs"
            :disabled="isFetching"
            @click="openSpamModal(row)"
          >
            Spam
          </AtomsButton>
        </div>
      </template>
    </AtomsTable>

    <MoleculesContactMarkSpamModal
      ref="spamModalRef"
      :submitting="markSpamSubmitting"
      @submit="onSpamSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import type {
  TContactListQueryParams,
  TContactRequest,
  TMarkSpamDto,
} from "~/types/contact-request.type";
import type { TTableColumn } from "~/types/table.type";
import { useContactRequest } from "~/composables/contact-request.composable";
import MoleculesContactMarkSpamModal from "~/components/molecules/ContactMarkSpamModal.vue";
import { Check, History } from "lucide-vue-next";

const {
  isFetching,
  listContacts,
  pagination,
  markSpamSubmitting,
  fetchContacts,
  setDone,
  markSpam,
} = useContactRequest();

const spamModalRef = ref<InstanceType<typeof MoleculesContactMarkSpamModal>>();

const doneFilter = ref<"all" | "done" | "todo">("all");

const doneFilterOptions = [
  { value: "all" as const, label: "Tất cả" },
  { value: "todo" as const, label: "Chưa xử lý" },
  { value: "done" as const, label: "Đã xử lý" },
];

const params = reactive<TContactListQueryParams>({
  page: 1,
  limit: 10,
});

const formatDt = (v: string | undefined) => {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString("vi-VN");
  } catch {
    return v;
  }
};

const columns = reactive<TTableColumn<TContactRequest>[]>([
  { key: "name", title: "Họ tên" },
  { key: "email", title: "Email" },
  { key: "phone", title: "Điện thoại" },
  {
    key: "done",
    title: "Trạng thái",
    render: (done) => ((done as boolean) ? "Đã xử lý" : "Chưa xử lý"),
  },
  {
    key: "createdAt",
    title: "Ngày gửi",
    render: (createdAt) => formatDt(createdAt as string),
  },
  { key: "actions", title: "Thao tác", slotKey: "actions" },
]);

const syncParamsDone = () => {
  if (doneFilter.value === "all") {
    delete params.done;
  } else {
    params.done = doneFilter.value === "done";
  }
};

const setDoneFilter = (value: "all" | "done" | "todo") => {
  doneFilter.value = value;
  params.page = 1;
  syncParamsDone();
  fetchContacts(params);
};

const onPageChange = (page: number) => {
  params.page = page;
  fetchContacts(params);
};

const toggleDone = async (row: TContactRequest) => {
  await setDone(row._id, !row.done);
};

const openSpamModal = (row: TContactRequest) => {
  spamModalRef.value?.openModal(row);
};

const onSpamSubmit = async (payload: { id: string; body: TMarkSpamDto }) => {
  const ok = await markSpam(payload.id, payload.body);
  if (ok) {
    spamModalRef.value?.closeModal();
    await fetchContacts(params);
  }
};

syncParamsDone();
fetchContacts(params);
</script>
