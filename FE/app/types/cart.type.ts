/** Dòng giỏ: đơn vị tính tiền theo `price` × `qty`. */
export type TCartLineItem = {
  id: string;
  productId?: number;
  name: string;
  desc?: string;
  tag?: string;
  image: string;
  qty: number;
  price: number;
};

export const CART_CHECKOUT_TAB_IDS = ["cart", "shipping", "payment"] as const;
export type TCartCheckoutTabId = (typeof CART_CHECKOUT_TAB_IDS)[number];

export type TCartTotals = {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
};
