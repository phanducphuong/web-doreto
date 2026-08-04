<template>
  <div class="space-y-10 mx-auto">
    <section class="bg-surface-container-low rounded-3xl p-(x-6 y-8) md:p-10">
      <div class="grid lg:grid-cols-[1fr_384px] gap-8 items-start">
        <div class="space-y-10">
          <h1 class="text-4xl leading-tight text-on-surface italic">Doreto</h1>

          <div class="space-y-8">
            <div
              v-for="(info, idx) in contactInfos"
              :key="info.label"
              class="flex items-start gap-4"
            >
              <component :is="info.icon" class="size-5 mt-1 text-secondary" />
              <div>
                <p class="text-xs uppercase tracking-wide text-on-surface-variant/70 font-semibold">
                  {{ info.label }}
                </p>
                <template v-if="info.key === 'phone'">
                  <a
                    :href="`tel:${info.value}`"
                    class="block text-4 text-on-surface mt-1 hover:opacity-85"
                  >
                    {{ info.displayValue }}
                  </a>
                </template>
                <template v-else>
                  <p class="text-4 text-on-surface mt-1">{{ info.value }}</p>
                </template>
              </div>
            </div>
          </div>
        </div>

        <OrganismsContactForm class="bg-white" />
      </div>
    </section>

    <section class="bg-surface-container-low rounded-3xl p-(x-6 y-8) md:p-10 space-y-5">
      <div>
        <h2 class="text-(3xl on-surface) font-semibold">Bản đồ showroom</h2>
        <p class="text-(sm on-surface-variant) mt-1">
          Bạn có thể đến trực tiếp showroom để xem đồ và nhận tư vấn chọn size, phối đồ chi tiết.
        </p>
      </div>

      <div class="rounded-2xl overflow-hidden border border-outline-variant/40 h-420px bg-white">
        <iframe
          class="w-full h-full border-0"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          allowfullscreen
          title="Doreto showroom map"
          src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d931.3228695706964!2d105.831037!3d20.98095!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ac5f30f430f7%3A0x10391d77595dd62!2zMjIgTmcuIDMzNyBQLiDEkOG7i25oIEPDtG5nLCDEkOG7i25oIEPDtG5nLCBUaGFuaCBYdcOibiwgSMOgIE7hu5lpLCBWaeG7h3QgTmFt!5e0!3m2!1svi!2sus!4v1671439480635!5m2!1svi!2sus"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { MapPin, Phone, UserRound, Clock3 } from "lucide-vue-next";

useSeoMeta({
  title: "Liên hệ | Doreto",
  description:
    "Liên hệ Doreto để được tư vấn sản phẩm thời trang và phối đồ phù hợp.",
});

useBreadcrumbSchema([
  { name: "Trang chủ", path: "/" },
  { name: "Liên hệ", path: "/lien-he" },
]);

const contactInfos = [
  {
    key: "director",
    label: "Giám đốc điều hành",
    value: "Ngô Mạnh Linh",
    icon: UserRound,
  },
  {
    key: "address",
    label: "Địa chỉ",
    value: "22 Ng. 337 P. Định Công, Định Công, Thanh Xuân, Hà Nội, Việt Nam",
    icon: MapPin,
  },
  {
    key: "phone",
    label: "Hotline",
    value: "0981 128 086",
    displayValue: "0981 128 086",
    icon: Phone,
  },
  {
    key: "phone",
    label: "Giờ mở cửa",
    displayValue: "09:00 - 21:00",
    value: "09:00 - 21:00",
    icon: Clock3,
  },
];
</script>
