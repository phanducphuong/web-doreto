<template>
  <div
    class="flex flex-wrap items-end gap-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4"
  >
    <AtomsFormItem label="Từ ngày">
      <AtomsFormInput v-model="localFromDate" type="date" class="min-w-46" />
    </AtomsFormItem>
    <AtomsFormItem label="Đến ngày">
      <AtomsFormInput v-model="localToDate" type="date" class="min-w-46" />
    </AtomsFormItem>
    <AtomsButton type="outline" @click="onApply">Áp dụng</AtomsButton>
    <AtomsButton type="ghost" @click="onReset">Đặt lại</AtomsButton>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  fromDate?: string;
  toDate?: string;
}>();

const emit = defineEmits<{
  (e: "apply", payload: { fromDate?: string; toDate?: string }): void;
}>();

const localFromDate = ref(props.fromDate || "");
const localToDate = ref(props.toDate || "");

watch(
  () => [props.fromDate, props.toDate],
  ([fromDate, toDate]) => {
    localFromDate.value = fromDate || "";
    localToDate.value = toDate || "";
  },
);

const onApply = () => {
  emit("apply", {
    fromDate: localFromDate.value || undefined,
    toDate: localToDate.value || undefined,
  });
};

const onReset = () => {
  localFromDate.value = "";
  localToDate.value = "";
  emit("apply", {});
};
</script>
