<template>
  <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
    <div class="rounded-2xl border border-outline-variant bg-white p-4">
      <p class="text-lg text-on-surface mb-8 font-semibold">Biến động đơn hàng theo thời gian</p>
      <AtomsHighChart :options="timeseriesOptions" />
    </div>

    <div class="rounded-2xl border border-outline-variant bg-white p-4">
      <p class="text-lg text-on-surface mb-8 font-semibold">Phễu trạng thái đơn hàng</p>
      <AtomsHighChart :options="funnelOptions" />
      <div
        v-if="funnelConversionTexts.length"
        class="mt-3 grid grid-cols-1 gap-1 text-xs text-outline"
      >
        <p v-for="item in funnelConversionTexts" :key="item">{{ item }}</p>
      </div>
    </div>

    <div class="rounded-2xl border border-outline-variant bg-white p-4 xl:col-span-2">
      <p class="text-lg text-on-surface mb-8 font-semibold">Top sản phẩm bán chạy</p>
      <AtomsHighChart :options="topProductsOptions" />
    </div>

    <div class="rounded-2xl border border-outline-variant bg-white p-4 xl:col-span-2">
      <p class="text-lg text-on-surface mb-8 font-semibold">Top khách hàng</p>
      <AtomsHighChart :options="topCustomersOptions" />
    </div>

    <div class="rounded-2xl border border-outline-variant bg-white p-4 xl:col-span-2">
      <p class="text-lg text-on-surface mb-8 font-semibold">Breakdown trạng thái theo ngày</p>
      <AtomsHighChart :options="statusTimeseriesOptions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Options } from "highcharts";

defineProps<{
  timeseriesOptions: Options;
  statusTimeseriesOptions: Options;
  funnelOptions: Options;
  topProductsOptions: Options;
  topCustomersOptions: Options;
  funnelConversionTexts: string[];
}>();
</script>
