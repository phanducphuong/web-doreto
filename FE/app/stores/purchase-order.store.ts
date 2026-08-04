import { defineStore } from "pinia";
import { PurchaseOrderStatus } from "~/types/purchase-order.type";
import type { TExistedPurchaseOrder, TPurchaseOrder } from "~/types/purchase-order.type";
import type { TExistedProduct, TOptionValue } from "~/types/product.type";
import type { TAddress } from "~/types/user.type";
import {
  getPurchaseOrderDetailText,
  getPurchaseOrderNextStatus,
} from "~/utils/purchase-order.utils";

export type TCartItem = {
  product: TExistedProduct;
  optionValue: TOptionValue;
  quantity: number;
};

export type TCartDrawerTab = "cart" | "shipping";
export const usePurchaseOrderStore = defineStore("purchase-order", () => {
  const { isLogin, user } = storeToRefs(useAuthStore());
  const loading = ref(false);
  const loadingStates = ref({
    fetch: false,
    upsert: false,
    delete: false,
    addToCart: false,
  });

  const purchaseOrders = ref<TExistedPurchaseOrder[]>([]);
  const cartOrder = computed(() =>
    purchaseOrders.value.find((o) => o.status === PurchaseOrderStatus.CART),
  );
  const currentOrder = ref<TExistedPurchaseOrder | null>(null);
  const listCartProduct = ref<TCartItem[]>([]);
  const buyNowItem = ref<TCartItem | null>(null);
  const isCartDrawerOpen = ref(false);
  const cartDrawerInitialTab = ref<TCartDrawerTab>("cart");

  // Tick chọn sản phẩm sẽ mua trong đơn này (bỏ tick = giữ lại giỏ, không tính tiền).
  // Mặc định mọi sản phẩm trong giỏ đều được tick.
  const selectedCartKeys = ref<string[]>([]);
  // Sản phẩm vừa bấm "Mua ngay" khi giỏ đã có hàng — để đưa lên đầu danh sách + gắn nhãn.
  const lastBuyNowKey = ref<string | null>(null);

  const getCartItemKey = (item: Pick<TCartItem, "product" | "optionValue">) =>
    `${item.product._id}:${item.optionValue._id || ""}`;

  const isCartItemSelected = (item: TCartItem) =>
    selectedCartKeys.value.includes(getCartItemKey(item));

  const markCartItemSelected = (item: Pick<TCartItem, "product" | "optionValue">) => {
    const key = getCartItemKey(item);
    if (!selectedCartKeys.value.includes(key)) {
      selectedCartKeys.value.push(key);
    }
  };

  const toggleCartItemSelected = (item: TCartItem) => {
    const key = getCartItemKey(item);
    if (selectedCartKeys.value.includes(key)) {
      selectedCartKeys.value = selectedCartKeys.value.filter((k) => k !== key);
    } else {
      selectedCartKeys.value.push(key);
    }
  };

  const selectAllCartItems = () => {
    selectedCartKeys.value = listCartProduct.value.map(getCartItemKey);
  };

  const checkoutItems = computed(() =>
    buyNowItem.value ? [buyNowItem.value] : listCartProduct.value.filter(isCartItemSelected),
  );

  const { $purchaseOrderRepository } = useNuxtApp();

  // ========================
  // FETCH
  // ========================
  const fetchOrders = async () => {
    try {
      loadingStates.value.fetch = true;
      const res = await $purchaseOrderRepository.getPurchaseOrdersByUser();
      purchaseOrders.value = res.data;
    } catch (error) {
      console.error("Fetch orders failed", error);
    } finally {
      loadingStates.value.fetch = false;
    }
  };

  const fetchOrderById = async (id: string) => {
    try {
      loading.value = true;
      const res = await $purchaseOrderRepository.getOne(id);
      currentOrder.value = res;
    } catch (error) {
      console.error("Fetch order failed", error);
    } finally {
      loading.value = false;
    }
  };

  // ========================
  // CREATE / UPDATE
  // ========================
  const upsertOrder = async (
    payload: Partial<TExistedPurchaseOrder>,
  ): Promise<TExistedPurchaseOrder | null> => {
    try {
      loadingStates.value.upsert = true;

      const method = payload._id
        ? $purchaseOrderRepository.updateOne
        : $purchaseOrderRepository.createOne;

      const res = await method(payload);

      // update local state
      if (payload._id) {
        const index = purchaseOrders.value.findIndex((o) => o._id === payload._id);
        if (index !== -1) purchaseOrders.value[index] = res;
      } else {
        purchaseOrders.value.unshift(res);
      }

      return res;
    } catch (error) {
      console.error("Upsert order failed", error);
      return null;
    } finally {
      loadingStates.value.upsert = false;
    }
  };

  // ========================
  // DELETE
  // ========================
  const deleteOrder = async (id: string): Promise<boolean> => {
    try {
      loadingStates.value.delete = true;
      await $purchaseOrderRepository.deleteOne(id);

      purchaseOrders.value = purchaseOrders.value.filter((o) => o._id !== id);

      return true;
    } catch (error) {
      console.error("Delete order failed", error);
      return false;
    } finally {
      loadingStates.value.delete = false;
    }
  };

  // ========================
  // UPDATE STATUS (IMPORTANT)
  // ========================
  const updateOrderStatus = async (id: string | number, status: TPurchaseOrder["status"]) => {
    try {
      loadingStates.value.upsert = true;

      const res = await $purchaseOrderRepository.updateOne({
        _id: id,
        status,
      });

      const index = purchaseOrders.value.findIndex((o) => o._id === id);
      if (index !== -1) purchaseOrders.value[index] = res;

      return res;
    } catch (error) {
      console.error("Update status failed", error);
    } finally {
      loadingStates.value.upsert = false;
    }
  };

  // ========================
  // CART FUNCTIONALITY
  // ========================
  const loadCartFromLocalStorage = () => {
    if (import.meta.client) {
      const cartData = localStorage.getItem("cartProducts");
      if (cartData) {
        try {
          const cartProductTemp = JSON.parse(cartData);
          listCartProduct.value.push(...cartProductTemp);
          selectAllCartItems();

          return cartProductTemp;
        } catch (error) {
          console.error("Failed to parse cart data from localStorage", error);
          listCartProduct.value = [];
        }
      }
    }
  };

  const saveCartToLocalStorage = () => {
    if (import.meta.client) {
      localStorage.setItem("cartProducts", JSON.stringify(listCartProduct.value));
    }
  };

  const syncCart = async () => {
    try {
      // Only sync if user is authenticated and there are items in cart
      if (!isLogin.value) {
        saveCartToLocalStorage();
        return true;
      }

      // Convert cart items to purchase items format
      const purchaseItems = listCartProduct.value.map((item) => ({
        productOptionValueId: item.optionValue._id || "",
        productId: item.product._id,
        count: item.quantity,
        price: item.optionValue.price || 0,
      }));

      // Create order payload
      const orderPayload: Partial<TExistedPurchaseOrder> = {
        userId: user.value._id,
        purchaseItems,
        status: PurchaseOrderStatus.CART,
        _id: cartOrder.value?._id,
      };

      const res = await upsertOrder(orderPayload);
      if (res) return true;
    } catch (error) {
      console.error("Sync cart to server failed", error);
      return false;
    }
    return false;
  };

  const loadCartFromServer = async () => {
    try {
      if (!isLogin.value) {
        return;
      }

      // Fetch orders for current user
      await fetchOrders();

      if (cartOrder.value && cartOrder.value.purchaseItems) {
        // Convert purchase items to cart items
        const cartItems: TCartItem[] = [];

        for (const purchaseItem of cartOrder.value.purchaseItems) {
          cartItems.push({
            product: purchaseItem.product!,
            optionValue: purchaseItem.productOptionValue!,
            quantity: purchaseItem.count,
          });
        }

        listCartProduct.value = cartItems;
        selectAllCartItems();
        // Also save to localStorage for persistence
        saveCartToLocalStorage();
      }
    } catch (error) {
      console.error("Load cart from server failed", error);
    }
  };

  const initializeCart = async () => {
    if (isLogin.value) {
      // User is authenticated - load cart from server first
      await loadCartFromServer();
    } else {
      // User is not authenticated - only load from localStorage
      loadCartFromLocalStorage();
    }
  };

  const addProductToCart = async (
    product: TExistedProduct,
    optionValue: TOptionValue,
    quantity = 1,
  ): Promise<boolean | undefined> => {
    try {
      loadingStates.value.addToCart = true;

      // Check if product with option value already exists in cart
      const existingIndex = listCartProduct.value.findIndex(
        (item) => item.product._id === product._id && item.optionValue._id === optionValue._id,
      );

      if (existingIndex !== -1) {
        // Product with option already in cart - increment quantity
        const cartItem = listCartProduct.value[existingIndex];
        if (cartItem) {
          cartItem.quantity += quantity;
        }
      } else {
        listCartProduct.value.push({ product, optionValue, quantity });
      }
      markCartItemSelected({ product, optionValue });

      const res = await syncCart();
      return res;
    } catch (error) {
      console.error("Add to cart failed", error);
      return false;
    } finally {
      loadingStates.value.addToCart = false;
    }
  };

  const removeProductFromCart = (
    productId: number | string,
    optionValueId: string,
    mode: "decrement" | "removeAll" = "removeAll",
  ) => {
    const index = listCartProduct.value.findIndex(
      (item) => item.product._id === productId && item.optionValue._id === optionValueId,
    );
    if (index !== -1) {
      const cartItem = listCartProduct.value[index];
      if (cartItem) {
        const itemKey = getCartItemKey(cartItem);
        if (mode === "decrement") {
          // Decrease quantity by 1, remove if quantity becomes 0
          if (cartItem.quantity > 1) {
            cartItem.quantity -= 1;
          } else {
            // Remove the item if quantity would become 0
            listCartProduct.value.splice(index, 1);
            selectedCartKeys.value = selectedCartKeys.value.filter((k) => k !== itemKey);
          }
        } else {
          // Remove the entire item
          listCartProduct.value.splice(index, 1);
          selectedCartKeys.value = selectedCartKeys.value.filter((k) => k !== itemKey);
        }
      }
    }

    syncCart();
  };

  const clearCartState = () => {
    listCartProduct.value = [];
    buyNowItem.value = null;
    selectedCartKeys.value = [];
    lastBuyNowKey.value = null;
    localStorage.removeItem("cartProducts");
  };

  /**
   * Sau khi đặt hàng thành công (chế độ giỏ hàng): chỉ xóa những sản phẩm đã đặt (đang tick),
   * sản phẩm bỏ tick vẫn giữ lại trong giỏ để mua sau.
   */
  const removeOrderedItemsFromCart = () => {
    const orderedKeys = new Set(checkoutItems.value.map(getCartItemKey));
    listCartProduct.value = listCartProduct.value.filter(
      (item) => !orderedKeys.has(getCartItemKey(item)),
    );
    selectedCartKeys.value = selectedCartKeys.value.filter((key) => !orderedKeys.has(key));
    lastBuyNowKey.value = null;

    if (listCartProduct.value.length) {
      // Còn hàng giữ lại: tạo giỏ mới trên server (đơn cũ đã chuyển sang chờ xác nhận)
      syncCart();
    } else {
      saveCartToLocalStorage();
    }
  };

  const setCartDrawerOpen = (value: boolean) => {
    isCartDrawerOpen.value = value;
  };

  const setCartDrawerInitialTab = (tab: TCartDrawerTab) => {
    cartDrawerInitialTab.value = tab;
  };

  const setBuyNowItem = (item: TCartItem | null) => {
    buyNowItem.value = item;
  };

  const setLastBuyNowKey = (key: string | null) => {
    lastBuyNowKey.value = key;
  };

  /** Chỉnh số lượng ở chế độ mua ngay 1 sản phẩm, kẹp trong khoảng [1, tồn kho]. */
  const updateBuyNowQuantity = (delta: number) => {
    if (!buyNowItem.value) return;
    const stock = buyNowItem.value.optionValue.stock ?? Number.POSITIVE_INFINITY;
    buyNowItem.value.quantity = Math.min(Math.max(1, buyNowItem.value.quantity + delta), stock);
  };

  // * HIENTT: chưa dùng tới
  // const updateQuantity = (productId: number | string, optionValueId: string, quantity: number) => {
  //   const index = listCartProduct.value.findIndex(
  //     (item) => item.product._id === productId && item.optionValue._id === optionValueId,
  //   );
  //   if (index !== -1) {
  //     if (quantity <= 0) {
  //       listCartProduct.value.splice(index, 1);
  //     } else {
  //       const cartItem = listCartProduct.value[index];
  //       if (cartItem) {
  //         cartItem.quantity = quantity;
  //       }
  //     }
  //   }
  // };

  const getDetailText = getPurchaseOrderDetailText;

  const submitPurchaseOrder = async (params: { address: TAddress }) => {
    if (!checkoutItems.value.length) return null;

    const purchaseItems = checkoutItems.value.map((item) => ({
      productOptionValueId: item.optionValue._id || "",
      productId: item.product._id,
      count: item.quantity,
      price: item.optionValue.price || 0,
    }));

    const orderPayload: Partial<TExistedPurchaseOrder> = {
      userId: user.value?._id,
      purchaseItems,
      status: PurchaseOrderStatus.PENDING,
      address: params.address,
      _id: buyNowItem.value ? undefined : cartOrder.value?._id,
    };

    return await upsertOrder(orderPayload);
  };

  return {
    // state
    purchaseOrders,
    currentOrder,
    listCartProduct,
    buyNowItem,
    lastBuyNowKey,
    selectedCartKeys,
    isCartDrawerOpen,
    cartDrawerInitialTab,
    checkoutItems,
    loading,
    loadingStates,

    // actions
    fetchOrders,
    fetchOrderById,
    deleteOrder,
    updateOrderStatus,

    // cart actions
    loadCartFromLocalStorage,
    saveCartToLocalStorage,
    loadCartFromServer,
    initializeCart,
    addProductToCart,
    removeProductFromCart,
    clearCartState,
    removeOrderedItemsFromCart,
    setCartDrawerOpen,
    setCartDrawerInitialTab,
    setBuyNowItem,
    setLastBuyNowKey,
    updateBuyNowQuantity,
    getCartItemKey,
    isCartItemSelected,
    toggleCartItemSelected,
    getDetailText,
    submitPurchaseOrder,
  };
});
