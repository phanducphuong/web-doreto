import type { RouterConfig } from "@nuxt/schema";

export default <RouterConfig>{
  routes: (_routes) => [
    {
      name: "home",
      path: "/",
      component: () => import("~/pages/index.vue"),
      meta: { layout: "layout-web" },
    },
    {
      name: "san-pham",
      path: "/san-pham",
      component: () => import("~/pages/san-pham.vue"),
      meta: { layout: "layout-web" },
    },
    {
      name: "danh-muc",
      path: "/danh-muc/:slug-I:id",
      component: () => import("~/pages/san-pham.vue"),
      meta: { layout: "layout-web" },
    },
    {
      name: "tim-kiem",
      path: "/tim-kiem",
      component: () => import("~/pages/tim-kiem.vue"),
      meta: { layout: "layout-web" },
    },
    {
      name: "chi-tiet-san-pham",
      path: "/san-pham/:slug",
      component: () => import("~/pages/chi-tiet-san-pham.vue"),
      meta: { layout: "layout-web" },
    },
    {
      name: "lien-he",
      path: "/lien-he",
      component: () => import("~/pages/lien-he.vue"),
      meta: { layout: "layout-web" },
    },
    {
      name: "cam-on-dat-hang",
      path: "/cam-on-dat-hang",
      component: () => import("~/pages/cam-on-dat-hang.vue"),
      meta: { layout: "layout-web" },
    },
    {
      name: "user-profile",
      path: "/profile",
      component: () => import("~/pages/profile.vue"),
      meta: { layout: "layout-web" },
    },
    {
      name: "user-order-history",
      path: "/profile/order-history",
      component: () => import("~/pages/order-history.vue"),
      meta: { layout: "layout-web" },
    },

    // * ADMIN ROUTES
    // Vào /admin mặc định chuyển tới trang Sản phẩm (việc chính là chỉnh sửa sản phẩm)
    {
      name: "admin-root",
      path: "/admin",
      redirect: "/admin/quan-ly-san-pham",
    },
    {
      name: "admin-dashboard",
      path: "/admin/dashboard",
      meta: { layout: "layout-admin" },
      component: () => import("~/pages/admin/dashboard.vue"),
    },
    {
      name: "category-management",
      path: "/admin/quan-ly-danh-muc",
      meta: { layout: "layout-admin" },
      component: () => import("~/pages/admin/category-management.vue"),
    },
    {
      name: "product-management",
      path: "/admin/quan-ly-san-pham",
      meta: { layout: "layout-admin" },
      component: () => import("~/pages/admin/product-management.vue"),
    },
    {
      name: "contact-requests",
      path: "/admin/yeu-cau-lien-he",
      meta: { layout: "layout-admin" },
      component: () => import("~/pages/admin/contact-requests.vue"),
    },
    {
      name: "spam-blocklist",
      path: "/admin/chan-spam",
      meta: { layout: "layout-admin" },
      component: () => import("~/pages/admin/spam-blocklist.vue"),
    },
    {
      name: "tag-management",
      path: "/admin/quan-ly-tag",
      meta: { layout: "layout-admin" },
      component: () => import("~/pages/admin/tag-management.vue"),
    },
    {
      name: "image-frame-management",
      path: "/admin/quan-ly-khung-anh",
      meta: { layout: "layout-admin" },
      component: () => import("~/pages/admin/image-frame-management.vue"),
    },
    {
      name: "purchase-order-management",
      path: "/admin/quan-ly-don-hang",
      meta: { layout: "layout-admin" },
      component: () => import("~/pages/admin/purchase-order-management.vue"),
    },
    {
      name: "feedback-management",
      path: "/admin/quan-ly-feedback",
      meta: { layout: "layout-admin" },
      component: () => import("~/pages/admin/feedback-management.vue"),
    },
    {
      name: "user-management",
      path: "/admin/quan-ly-nguoi-dung",
      meta: { layout: "layout-admin" },
      component: () => import("~/pages/admin/user-management.vue"),
    },
  ],
};
