<template>
  <ClientOnly>
    <div ref="chartContainerRef" class="w-full" />
  </ClientOnly>
</template>

<script setup lang="ts">
import Highcharts from "highcharts";
import type { Options } from "highcharts";

const props = defineProps<{
  options: Options;
}>();

const chartContainerRef = ref<HTMLElement | null>(null);
let chartInstance: Highcharts.Chart | null = null;
let funnelModuleReady = false;

const ensureFunnelModule = async () => {
  if (!import.meta.client || funnelModuleReady) return;
  const moduleExports = await import("highcharts/modules/funnel");
  const initModule = (moduleExports.default || moduleExports) as unknown as
    | ((highcharts: typeof Highcharts) => void)
    | undefined;

  if (typeof initModule === "function") {
    initModule(Highcharts);
  }
  funnelModuleReady = true;
};

const renderChart = async () => {
  if (!import.meta.client) return;
  await nextTick();

  if (!chartContainerRef.value) return;
  await ensureFunnelModule();

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = Highcharts.chart(chartContainerRef.value, props.options);
};

onMounted(() => {
  renderChart();
});

onActivated(() => {
  renderChart();
});

watch(
  () => props.options,
  () => {
    renderChart();
  },
  { deep: true, flush: "post" },
);

onBeforeUnmount(() => {
  chartInstance?.destroy();
  chartInstance = null;
});
</script>
