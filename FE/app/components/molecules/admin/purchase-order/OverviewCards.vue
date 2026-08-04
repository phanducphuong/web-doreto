<template>
  <div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
    <button
      v-for="card in cards"
      :key="card.key"
      type="button"
      class="rounded-2xl border p-4 text-left transition bg-white"
      :class="[
        activeState === card.state
          ? 'border-primary bg-primary/5'
          : 'border-outline-variant bg-surface-container-low hover:border-primary/60',
      ]"
      @click="$emit('select-state', card.state)"
    >
      <p class="text-xs text-outline">{{ card.label }}</p>
      <p class="mt-1 text-lg font-semibold">{{ card.value }}</p>
      <p v-if="card.subValue" class="mt-1 text-xs text-outline">{{ card.subValue }}</p>
      <p
        v-if="card.trendText"
        class="mt-1 text-xs font-medium"
        :class="card.trendPositive ? 'text-emerald-600' : 'text-red-600'"
      >
        {{ card.trendText }}
      </p>
    </button>
  </div>
</template>

<script setup lang="ts">
import { PurchaseOrderStatus } from "~/types/purchase-order.type";

type TOverviewCard = {
  key: string;
  label: string;
  value: string | number;
  subValue?: string;
  trendText?: string;
  trendPositive?: boolean;
  state?: PurchaseOrderStatus;
};

defineProps<{
  cards: TOverviewCard[];
  activeState?: PurchaseOrderStatus;
}>();

defineEmits<{
  (e: "select-state", state?: PurchaseOrderStatus): void;
}>();
</script>
