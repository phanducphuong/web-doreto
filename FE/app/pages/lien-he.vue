<template>
  <div class="space-y-10 mx-auto">
    <section class="bg-surface-container-low rounded-3xl p-(x-6 y-8) md:p-10">
      <div class="grid lg:grid-cols-[1fr_384px] gap-8 items-start">
        <div class="space-y-8">
          <div class="space-y-3">
            <h1 class="text-4xl leading-tight text-on-surface italic">Doreto</h1>
            <p class="text-(sm on-surface-variant) max-w-md">
              Thời trang nam Doreto — Rise · Improve · Evolve. Để lại lời nhắn hoặc gọi hotline,
              đội ngũ Doreto sẽ hỗ trợ bạn nhanh nhất.
            </p>
          </div>

          <div class="space-y-8">
            <div
              v-for="info in contactInfos"
              :key="info.label"
              class="flex items-start gap-4"
            >
              <component :is="info.icon" class="size-5 mt-1 text-secondary" />
              <div>
                <p class="text-xs uppercase tracking-wide text-on-surface-variant/70 font-semibold">
                  {{ info.label }}
                </p>
                <a
                  :href="`tel:${info.value}`"
                  class="block text-4 text-on-surface mt-1 hover:opacity-85"
                >
                  {{ info.displayValue }}
                </a>
              </div>
            </div>
          </div>
        </div>

        <OrganismsContactForm class="bg-white" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Phone } from "lucide-vue-next";

useSeoMeta({
  title: "Liên hệ | Doreto",
  description:
    "Liên hệ Doreto để được tư vấn sản phẩm thời trang nam và hỗ trợ đặt hàng nhanh chóng.",
});

useBreadcrumbSchema([
  { name: "Trang chủ", path: "/" },
  { name: "Liên hệ", path: "/lien-he" },
]);

const contactInfos = [
  {
    label: "Hotline",
    value: "0981128086",
    displayValue: "0981 128 086",
    icon: Phone,
  },
];
</script>
