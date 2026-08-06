import type { TTrackingApi, TTrackingAttribution } from "~/types/tracking.type";

// Wrapper mỏng quanh $tracking (plugin 03.tracking.client.ts).
// $tracking chỉ tồn tại phía client (.client plugin) → optional chaining khắp nơi,
// KHÔNG hàm nào được ném lỗi vào luồng UI (D-07).
export function useTracking() {
  // Lấy $tracking mỗi lần gọi để có ngữ cảnh Nuxt đúng (an toàn khi SSR = undefined).
  const getApi = (): TTrackingApi | undefined =>
    useNuxtApp().$tracking as TTrackingApi | undefined;

  // Xem chi tiết 1 sản phẩm.
  const trackProductView = (productId: string) =>
    getApi()?.trackEvent("product_view", { productId });

  // Thêm sản phẩm vào giỏ.
  const trackAddToCart = (productId: string) =>
    getApi()?.trackEvent("add_to_cart", { productId });

  // Bước vào trang giao hàng (bắt đầu checkout).
  const trackBeginCheckout = () => getApi()?.trackEvent("begin_checkout");

  // Đặt đơn thành công.
  const trackOrderSuccess = (orderId: string) =>
    getApi()?.trackEvent("order_success", { orderId });

  // Gửi form liên hệ thành công.
  const trackContactForm = () => getApi()?.trackEvent("contact_form");

  // Attribution first-touch để bơm vào payload đơn/liên hệ.
  const getAttribution = (): TTrackingAttribution => getApi()?.getAttribution() ?? {};

  return {
    trackProductView,
    trackAddToCart,
    trackBeginCheckout,
    trackOrderSuccess,
    trackContactForm,
    getAttribution,
  };
}
