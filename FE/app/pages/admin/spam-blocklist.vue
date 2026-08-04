<template>
  <div>
    <h1 class="cms-title mb-8">Danh sách chặn spam</h1>

    <div
      class="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-third-light/40 bg-third-light/5 p-4"
    >
      <AtomsFormItem label="Loại" class="min-w-36">
        <select
          v-model="newKind"
          class="h-9 w-full rounded-md border border-third-light bg-white px-2 text-sm outline-none focus:ring-1 focus:ring-secondary"
        >
          <option value="email">Email</option>
          <option value="phone">Số điện thoại</option>
        </select>
      </AtomsFormItem>

      <AtomsFormItem label="Giá trị" class="min-w-48 flex-1">
        <AtomsFormInput
          v-model="newValue"
          placeholder="Nhập email hoặc số điện thoại"
          class="!rounded-md bg-white"
        />
      </AtomsFormItem>

      <AtomsButton
        type="primary"
        class="shrink-0"
        :is-loading="addSubmitting"
        :disabled="addSubmitting"
        @click="onAdd"
      >
        Thêm chặn
      </AtomsButton>
    </div>

    <AtomsTable
      :columns="columns"
      :data="listSpamBlocks"
      :pagination="pagination"
      disable-row-select
      @change="onPageChange"
    >
      <template #actions="{ row }">
        <div @click.stop>
          <AtomsButton
            type="danger"
            class="min-h-8 text-xs"
            :is-loading="removeSubmittingKey === blockKey(row)"
            :disabled="Boolean(removeSubmittingKey) || addSubmitting"
            @click="onRemove(row)"
          >
            Gỡ
          </AtomsButton>
        </div>
      </template>
    </AtomsTable>
  </div>
</template>

<script setup lang="ts">
import type { TSpamBlock } from "~/types/contact-request.type";
import type { TSpamBlocklistQueryParams } from "~/types/contact-request.type";
import type { TTableColumn } from "~/types/table.type";
import { useSpamBlocklist } from "~/composables/contact-request.composable";

const {
  listSpamBlocks,
  pagination,
  addSubmitting,
  removeSubmittingKey,
  fetchSpamList,
  addSpam,
  removeSpam,
} = useSpamBlocklist();

const newKind = ref<"email" | "phone">("email");
const newValue = ref("");

const params = reactive<TSpamBlocklistQueryParams>({
  page: 1,
  limit: 10,
});

const blockKey = (b: TSpamBlock) => `${b.kind}:${b.value}`;

const columns = reactive<TTableColumn<TSpamBlock>[]>([
  {
    key: "kind",
    title: "Loại",
    render: (k) => ((k as string) === "email" ? "Email" : "Điện thoại"),
  },
  { key: "value", title: "Giá trị" },
  { key: "actions", title: "Thao tác", slotKey: "actions" },
]);

const onPageChange = (page: number) => {
  params.page = page;
  fetchSpamList(params);
};

const onAdd = async () => {
  const ok = await addSpam(newKind.value, newValue.value);
  if (ok) {
    newValue.value = "";
    await fetchSpamList(params);
  }
};

const onRemove = async (row: TSpamBlock) => {
  const ok = await removeSpam(row);
  if (ok) {
    await fetchSpamList(params);
  }
};

fetchSpamList(params);
</script>
