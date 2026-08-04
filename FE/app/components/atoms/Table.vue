<template>
  <div
    class="overflow-hidden rounded-2xl border border-outline-variant bg-surface text-(sm on-surface) leading-[1.5715] shadow-[0_22px_40px_-34px_rgba(97,0,0,0.65)]"
  >
    <div class="overflow-x-auto w-full">
      <table class="w-full border-collapse text-left" :aria-busy="isLoading">
        <thead>
          <tr class="bg-surface-container-low">
            <th
              v-for="col in columns"
              :key="String(col.key)"
              class="border-b border-r border-surface-variant p-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant last:border-r-0"
              :class="{ 'text-center': col.center }"
            >
              {{ col.title }}
            </th>
          </tr>
        </thead>

        <tbody v-if="isLoading">
          <tr
            v-for="skeletonRow in resolvedSkeletonRows"
            :key="`sk-${skeletonRow}`"
            class="bg-surface transition-colors duration-100"
          >
            <td
              v-for="(col, colIndex) in columns"
              :key="`sk-${skeletonRow}-${String(col.key)}`"
              class="border-b border-r border-surface-container p-3.5 align-middle last:border-r-0"
              :class="[col.colClass, { 'text-center': col.center }]"
            >
              <div
                class="h-3.5 max-w-full animate-pulse rounded-full bg-surface-variant"
                :class="{ 'mx-auto': col.center }"
                :style="{ width: skeletonBarWidth(skeletonRow - 1, colIndex) }"
              />
            </td>
          </tr>
        </tbody>

        <tbody v-else>
          <tr
            v-for="(row, rowIndex) in data"
            :key="rowIndex"
            class="bg-surface transition-colors duration-150 hover:bg-surface-container-low"
            :class="{
              'cursor-pointer': !disableRowSelect,
            }"
            @click="onRowClick(row)"
          >
            <td
              v-for="col in columns"
              :key="String(col.key)"
              class="border-b border-r border-surface-container p-3.5 align-middle text-on-surface last:border-r-0"
              :class="[
                col.colClass,
                {
                  'text-center': col.center,
                },
              ]"
            >
              <template v-if="col.slotKey">
                <slot
                  :name="col.slotKey"
                  :row="row"
                  :value="cellValue(row, col.key)"
                  :column="col"
                />
              </template>
              <template v-else-if="col.render">
                {{ col.render(cellValue(row, col.key) as T[keyof T], row) }}
              </template>
              <template v-else>
                {{ cellValue(row, col.key) }}
              </template>
            </td>
          </tr>

          <tr v-if="!data.length">
            <td
              :colspan="Math.max(columns.length, 1)"
              class="border-b border-surface-container bg-surface px-4 py-16 text-center text-outline"
            >
              No data
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="p-6">
      <MoleculesCommonPagination
        v-if="pagination && pagination.totalPage > 0"
        :page="pagination.page"
        :total="pagination.total"
        :limit="pagination.count"
        @change="onPaginationChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts" generic="T">
import type { TTableColumn, TTablePagination } from "~/types/table.type";
import MoleculesCommonPagination from "~/components/molecules/common/Pagination.vue";

const {
  columns,
  data,
  pagination,
  disableRowSelect = false,
  isLoading = false,
  loadingRowCount,
} = defineProps<{
  columns: TTableColumn<T>[];
  data: T[];
  pagination?: TTablePagination;
  /** Không emit select-record / không style click (CMS bảng có nút trong hàng). */
  disableRowSelect?: boolean;
  isLoading?: boolean;
  /** Số hàng skeleton khi loading */
  loadingRowCount?: number;
}>();

const resolvedSkeletonRows = computed(() => {
  const raw = loadingRowCount ?? pagination?.count ?? 10;
  return Math.min(100, Math.max(1, Math.floor(raw)));
});

const skeletonWidths = ["72%", "88%", "64%", "92%", "56%", "80%"] as const;

const skeletonBarWidth = (rowIndex: number, colIndex: number) =>
  skeletonWidths[(rowIndex + colIndex) % skeletonWidths.length]!;

const emit = defineEmits<{
  (e: "change", page: number): void;
  (e: "select-record", record: T): void;
}>();

const cellValue = (row: T, key: TTableColumn<T>["key"]) =>
  (row as Record<string, unknown>)[key as string];

const onRowClick = (row: T) => {
  if (disableRowSelect) return;
  emit("select-record", row);
};

const onPaginationChange = (page: number) => {
  emit("change", page);
};
</script>
