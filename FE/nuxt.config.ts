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
      apiBaseUrl:
        import.meta.env.NUXT_PUBLIC_API_BASE_URL || "https://be-nemp-production.up.railway.app",
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
        { property: "og:title", content: "Doreto" },
        { property: "og:image", content: "/banner.webp" },
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=TikTok+Sans:opsz,wght@12..36,300..900&display=swap",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&family=Roboto:wght@400;500;600;700&family=Open+Sans:wght@400;500;600;700&family=Lato:wght@400;700&family=Nunito+Sans:wght@400;600;700&family=Source+Sans+3:wght@400;500;600;700&family=Noto+Sans:wght@400;500;600;700&family=Mulish:wght@400;500;600;700&display=swap",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=diamond,forest,landscape,local_fire_department,water_drop",
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
    domains: ["localhost", "127.0.0.1", "res.cloudinary.com", "cdn.decorviet.com.vn"],
  },

  vite: {
    optimizeDeps: {
      include: ["lucide-vue-next", "@unocss/transformer-compile-class", "nuxt-toast"],
    },
  },
});
