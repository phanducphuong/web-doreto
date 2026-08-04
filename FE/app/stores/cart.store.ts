export const useCartStore = defineStore("cart", () => {
  const cart = ref({
    id: "",
    name: "",
    price: 0,
    quantity: 0,
  });
});
