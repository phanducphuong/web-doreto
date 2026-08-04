<template>
  <aside
    class="w-60 shrink-0 h-full rounded-3xl border border-outline-variant bg-surface p-(x-4 y-2) shadow-[0_18px_32px_-28px_rgba(97,0,0,0.6)]"
  >
    <div class="mb-5 border-(b surface-variant) pb-4">
      <h4 class="mt-2 text-(xl on-surface) font-semibold">Quản lý hệ thống</h4>
    </div>

    <div class="space-y-1.5">
      <NuxtLink
        v-for="item in items"
        :key="item.label"
        :to="item.to"
        class="group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200 hover:bg-surface-container-low"
        :class="
          $route.name === item.name ? 'gradient-primary text-white' : 'text-on-surface-variant'
        "
      >
        <span
          class="flex size-8 shrink-0 items-center justify-center rounded-xl border transition-colors duration-200"
          :class="
            $route.name === item.name
              ? 'border-white/30 bg-white/15 text-white'
              : 'border-outline-variant bg-white text-primary group-hover:border-outline-variant'
          "
        >
          <component :is="item.icon" class="size-4" />
        </span>
        <span class="text-sm font-medium leading-5">{{ item.label }}</span>
      </NuxtLink>
    </div>
  </aside>
</template>

<script setup lang="ts">
import {
  Ban,
  Folder,
  LayoutDashboard,
  Mail,
  MessageSquareMore,
  ShoppingCart,
  Tags,
  Users,
  Frame,
} from "lucide-vue-next";

const items = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    to: "/admin/dashboard",
    name: "admin-dashboard",
  },
  {
    label: "Danh mục",
    icon: Folder,
    to: "/admin/quan-ly-danh-muc",
    name: "category-management",
  },
  {
    label: "Sản phẩm",
    icon: ShoppingCart,
    to: "/admin/quan-ly-san-pham",
    name: "product-management",
  },
  {
    label: "Liên hệ",
    icon: Mail,
    to: "/admin/yeu-cau-lien-he",
    name: "contact-requests",
  },
  {
    label: "Chặn spam",
    icon: Ban,
    to: "/admin/chan-spam",
    name: "spam-blocklist",
  },
  {
    label: "Tag",
    icon: Tags,
    to: "/admin/quan-ly-tag",
    name: "tag-management",
  },
  {
    label: "Khung ảnh",
    icon: Frame,
    to: "/admin/quan-ly-khung-anh",
    name: "image-frame-management",
  },
  {
    label: "Đơn hàng",
    icon: ShoppingCart,
    to: "/admin/quan-ly-don-hang",
    name: "purchase-order-management",
  },
  {
    label: "Feedback",
    icon: MessageSquareMore,
    to: "/admin/quan-ly-feedback",
    name: "feedback-management",
  },
  {
    label: "Người dùng",
    icon: Users,
    to: "/admin/quan-ly-nguoi-dung",
    name: "user-management",
  },
];
</script>
