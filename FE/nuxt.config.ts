// const manrope400 = new URL("./app/assets/fonts/Manrope/manrope-regular.woff2", import.meta.url)
//   .href;
// const manrope500 = new URL("./app/assets/fonts/Manrope/manrope-medium.woff2", import.meta.url).href;
// const manrope600 = new URL("./app/assets/fonts/Manrope/manrope-semibold.woff2", import.meta.url)
//   .href;
// const manrope700 = new URL("./app/assets/fonts/Manrope/manrope-bold.woff2", import.meta.url).href;

// const notoSerif400 = new URL(
//   "./app/assets/fonts/Noto_Serif/noto-serif-regular.woff2",
//   import.meta.url,
// ).href;
// const notoSerif600 = new URL(
//   "./app/assets/fonts/Noto_Serif/noto-serif-semibold.woff2",
//   import.meta.url,
// ).href;
// const notoSerif700 = new URL("./app/assets/fonts/Noto_Serif/noto-serif-bold.woff2", import.meta.url)
//   .href;

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },
  modules: ["@unocss/nuxt", "@pinia/nuxt", "nuxt-toast", "@nuxt/image"],

  runtimeConfig: {
    public: {
      // TODO(deploy): thay bằng URL thật của service doreto-be sau khi deploy Cloud Run
      // (hoặc custom domain, vd https://api.dorreto.com). KHÔNG để trỏ về BE decor.
      apiBaseUrl:
        import.meta.env.NUXT_PUBLIC_API_BASE_URL || "https://api.dorreto.com",
    },
  },

  css: [
    "~/assets/css/app.css",
    "~/assets/css/override.scss",
    "~/assets/styles/desc-framed-image.scss",
  ],
  app: {
    head: {
      meta: [
        {
          name: "viewport",
          // viewport-fit=cover: để env(safe-area-inset-*) có giá trị thật trên iPhone (né vạch home)
          // user-scalable=no: chặn zoom toàn trang (ảnh vẫn zoom được trong trình xem ảnh PhotoSwipe)
          content:
            "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
        },
        { property: "og:title", content: "Doreto — Thời trang nam" },
        { property: "og:image", content: "/banner.jpg" },
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        // TikTok Sans dùng cho một số thành phần UI → giữ tải chặn để không nhấp nháy.
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=TikTok+Sans:opsz,wght@12..36,300..900&display=swap",
        },
        // 10 họ font này CHỈ là danh sách font-picker của editor (mô tả sản phẩm) —
        // không cần cho hiển thị trang chủ/danh sách. Tải KHÔNG chặn render bằng mẹo
        // media="print" + onload: trang paint ngay, font áp sau khi tải xong (mô tả
        // có chọn font vẫn hiện đúng, chỉ swap nhẹ). Bỏ 2 request render-blocking.
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&family=Roboto:wght@400;500;600;700&family=Open+Sans:wght@400;500;600;700&family=Lato:wght@400;700&family=Nunito+Sans:wght@400;600;700&family=Source+Sans+3:wght@400;500;600;700&family=Noto+Sans:wght@400;500;600;700&family=Mulish:wght@400;500;600;700&display=swap",
          media: "print",
          onload: "this.media='all'",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=diamond,forest,landscape,local_fire_department,water_drop",
          media: "print",
          onload: "this.media='all'",
        },
        {
          rel: "icon",
          type: "image/png",
          href: "/favicon.png",
        },
      ],
    },
    pageTransition: { name: "page", mode: "out-in" },
  },

  image: {
    // Ảnh được resize/nén NGAY TẠI BIÊN Cloudflare (/cdn-cgi/image/) và cache ở
    // đó — Cloud Run không còn đụng vào ảnh nữa. Xem app/providers/cf-images.ts.
    // ⚠️ Cần bật "Image Transformations" cho zone dorreto.com trong dashboard
    // Cloudflare trước khi deploy bản này, nếu không ảnh sẽ 404.
    provider: "cfImages",
    providers: {
      cfImages: {
        name: "cfImages",
        provider: "~/providers/cf-images.ts",
        options: { baseURL: "https://cdn.dorreto.com" },
      },
    },
    domains: ["localhost", "127.0.0.1", "cdn.dorreto.com", "pub-7d4bde061b564d499f9749154f05527f.r2.dev"],

    // Dự phòng: nếu muốn quay lại resize tại server (ipx), bỏ 2 dòng provider ở
    // trên là @nuxt/image tự dùng lại _ipx (kèm plugin server/plugins/force-ipv4.ts).
    ipx: {
      http: {
        fetchOptions: { retry: 3, retryDelay: 250, timeout: 10_000 },
      },
    },
  },

  vite: {
    optimizeDeps: {
      include: ["lucide-vue-next", "@unocss/transformer-compile-class", "nuxt-toast"],
    },
  },
});
