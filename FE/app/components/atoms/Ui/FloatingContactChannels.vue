<template>
  <ClientOnly>
    <Teleport to="body">
      <nav class="floating-contact-channels" aria-label="Liên hệ nhanh">
        <ul class="floating-contact-channels__list">
          <li
            v-for="channel in channels"
            :key="channel.id"
            class="floating-contact-channels__item"
            :class="{
              'floating-contact-channels__item--in-mobile-cta':
                channel.id === 'Link-0' && isProductDetailPage,
            }"
          >
            <a
              :href="channel.href"
              :target="channel.target || undefined"
              class="floating-contact-channels__link"
              :aria-label="channel.label"
              :rel="channel.target === '_blank' ? 'noopener noreferrer' : undefined"
            >
              <img
                v-if="channel.iconType === 'image'"
                :src="channel.iconSrc"
                :alt="channel.label"
                class="floating-contact-channels__img"
                width="48"
                height="48"
              />
              <svg
                v-else-if="channel.iconType === 'phone'"
                aria-hidden="true"
                class="floating-contact-channels__svg"
                width="48"
                height="48"
                viewBox="0 0 39 39"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="19.4395" cy="19.4395" r="19.4395" fill="#03E78B" />
                <path
                  d="M19.3929 14.9176C17.752 14.7684 16.2602 14.3209 14.7684 13.7242C14.0226 13.4259 13.1275 13.7242 12.8292 14.4701L11.7849 16.2602C8.65222 14.6193 6.11623 11.9341 4.47529 8.95057L6.41458 7.90634C7.16046 7.60799 7.45881 6.71293 7.16046 5.96705C6.56375 4.47529 6.11623 2.83435 5.96705 1.34259C5.96705 0.596704 5.22117 0 4.47529 0H0.745882C0.298353 0 5.69062e-07 0.298352 5.69062e-07 0.745881C5.69062e-07 3.72941 0.596704 6.71293 1.93929 9.3981C3.87858 13.575 7.30964 16.8569 11.3374 18.7962C14.0226 20.1388 17.0061 20.7355 19.9896 20.7355C20.4371 20.7355 20.7355 20.4371 20.7355 19.9896V16.4094C20.7355 15.5143 20.1388 14.9176 19.3929 14.9176Z"
                  transform="translate(9.07179 9.07178)"
                  fill="white"
                />
              </svg>
              <span class="floating-contact-channels__tooltip">{{ channel.label }}</span>
            </a>
          </li>
        </ul>
      </nav>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
type TChannel = {
  id: string;
  channelType: "Phone" | "Link";
  label: string;
  href: string;
  target: "" | "_blank";
  iconType: "phone" | "image";
  iconSrc?: string;
};

const route = useRoute();
// Trang chi tiết sản phẩm mobile đã có nút Zalo trong thanh CTA dưới cùng
const isProductDetailPage = computed(() => route.name === "chi-tiet-san-pham");

const channels: TChannel[] = [
  {
    id: "Phone-0",
    channelType: "Phone",
    label: "Gọi điện",
    href: "tel:+84981128086",
    target: "",
    iconType: "phone",
  },
  {
    id: "Link-0",
    channelType: "Link",
    label: "Zalo",
    href: "https://zalo.me/0981128086",
    target: "_blank",
    iconType: "image",
    iconSrc: "/zalo-icon.svg",
  },
];
</script>

<style scoped>
.floating-contact-channels {
  position: fixed;
  left: 1rem;
  bottom: 5.5rem;
  z-index: 45;
  pointer-events: none;
}

@media (min-width: 768px) {
  .floating-contact-channels {
    left: 1.5rem;
    bottom: 2rem;
  }
}

.floating-contact-channels__list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.floating-contact-channels__item {
  pointer-events: auto;
}

/* Dưới breakpoint lg, thanh CTA mobile của trang sản phẩm đã chứa nút Zalo */
@media (max-width: 1023px) {
  .floating-contact-channels__item--in-mobile-cta {
    display: none;
  }
}

.floating-contact-channels__link {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  overflow: hidden;
  background: #fff;
  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(0, 0, 0, 0.04);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.floating-contact-channels__link:hover {
  transform: scale(1.06);
  box-shadow:
    0 6px 18px rgba(0, 0, 0, 0.16),
    0 0 0 1px rgba(0, 0, 0, 0.06);
}

.floating-contact-channels__img,
.floating-contact-channels__svg {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.floating-contact-channels__tooltip {
  position: absolute;
  left: calc(100% + 0.5rem);
  top: 50%;
  transform: translateY(-50%);
  padding: 0.35rem 0.65rem;
  border-radius: 0.375rem;
  background: rgba(27, 28, 28, 0.92);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition:
    opacity 0.15s ease,
    visibility 0.15s ease;
}

.floating-contact-channels__tooltip::after {
  content: "";
  position: absolute;
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
  border: 4px solid transparent;
  border-right-color: rgba(27, 28, 28, 0.92);
}

.floating-contact-channels__link:hover .floating-contact-channels__tooltip,
.floating-contact-channels__link:focus-visible .floating-contact-channels__tooltip {
  opacity: 1;
  visibility: visible;
}

.floating-contact-channels__link:focus-visible {
  outline: 2px solid #d85510;
  outline-offset: 2px;
}
</style>
