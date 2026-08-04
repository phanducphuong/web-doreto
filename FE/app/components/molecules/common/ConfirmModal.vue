<template>
  <MoleculesCommonModal :default-visible="true" :header="title">
    {{ content }}

    <template #footer>
      <AtomsButton type="danger" :icon="X" @click="onResolve(false)">
        {{ confirmText }}
      </AtomsButton>
      <AtomsButton type="primary" :icon="Check" @click="onResolve(true)">
        {{ cancelText }}
      </AtomsButton>
    </template>
  </MoleculesCommonModal>
</template>

<script lang="ts" setup>
import { Check, X } from "lucide-vue-next";

const {
  title,
  content,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  onResolve,
} = defineProps<{
  title?: string;
  content: string;
  confirmText?: string;
  cancelText?: string;
  onResolve: (decision: boolean) => void;
}>();
</script>
