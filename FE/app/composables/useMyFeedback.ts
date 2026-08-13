import { FEEDBACK_MESSAGES, FEEDBACK_QUERY_KEYS } from "~/constants/feedback.constant";
import type { TFeedback } from "~/types/feedback.type";
import type { TExistedPurchaseOrder, TPurchaseItem } from "~/types/purchase-order.type";
import { getApiErrorMessage } from "~/utils/api-error";
import { getEntityId, isAdminUser, isHttpErrorStatus } from "~/utils/feedback.utils";

export default function useMyFeedback(productId: MaybeRefOrGetter<number | string | undefined>) {
  const { $feedbackRepository, $purchaseOrderRepository } = useNuxtApp();
  const authStore = useAuthStore();
  const { isLogin, user } = storeToRefs(authStore);

  const myFeedback = ref<TFeedback | null>(null);
  const matchedOrder = ref<TExistedPurchaseOrder | null>(null);
  const eligiblePurchaseOrderId = ref("");
  const isLoading = ref(false);
  const error = ref("");

  const mineKey = computed(() => FEEDBACK_QUERY_KEYS.mine(toValue(productId) || "unknown"));
  const purchaseKey = computed(() =>
    FEEDBACK_QUERY_KEYS.purchaseStatus(toValue(productId) || "unknown"),
  );

  const normalizedProductId = computed(() => {
    const value = toValue(productId);
    if (value === undefined || value === null || value === "") return null;
    return String(value);
  });

  const isAdmin = computed(() => isAdminUser(user.value));

  const matchedPurchaseItems = computed<TPurchaseItem[]>(() => {
    if (!matchedOrder.value || normalizedProductId.value === null) return [];
    return matchedOrder.value.purchaseItems.filter(
      (item) => String(item.productId) === String(normalizedProductId.value),
    );
  });

  const purchasedOptionLabels = computed(() => {
    const labels = matchedPurchaseItems.value
      .map((item) => item.productOptionValue?.productOptionNames?.filter(Boolean).join(" / "))
      .filter((value): value is string => Boolean(value));
    return [...new Set(labels)];
  });

  /** Đã mua sản phẩm này (tồn tại matchedOrder) hoặc đã có feedback trước đó */
  const hasPurchased = computed(
    () => Boolean(matchedOrder.value) || Boolean(myFeedback.value),
  );

  const canManageFeedback = computed(() => {
    return Boolean(isLogin.value && !isAdmin.value && hasPurchased.value);
  });

  const fetchPurchaseStatus = async () => {
    if (!isLogin.value || isAdmin.value || normalizedProductId.value === null) {
      matchedOrder.value = null;
      eligiblePurchaseOrderId.value = "";
      return;
    }

    void purchaseKey.value;

    // BE lọc thẳng theo productId + trạng thái đủ điều kiện đánh giá (confirmed/
    // shipped/delivered). Trước đây kéo 100 đơn đầu rồi lọc client → khách >100 đơn
    // mất quyền đánh giá vì đơn mua SP này rơi ngoài trang 1.
    const ordersWithProduct = await $purchaseOrderRepository.getFeedbackEligibleOrders(
      String(normalizedProductId.value),
    );
    matchedOrder.value = ordersWithProduct[0] ?? null;

    // Dùng cho action gửi feedback mới (BE yêu cầu order chưa feedback)
    const eligibleOrder = ordersWithProduct.find((order) => !order.isFeedbacked);
    eligiblePurchaseOrderId.value = eligibleOrder?._id ? String(eligibleOrder._id) : "";
  };

  const fetchMyFeedback = async () => {
    if (!isLogin.value || isAdmin.value || normalizedProductId.value === null) {
      myFeedback.value = null;
      matchedOrder.value = null;
      error.value = "";
      eligiblePurchaseOrderId.value = "";
      return;
    }

    try {
      void mineKey.value;
      isLoading.value = true;
      error.value = "";

      await fetchPurchaseStatus();

      try {
        myFeedback.value =
          (await $feedbackRepository.getMyFeedback(normalizedProductId.value)) || null;
      } catch (feedbackError) {
        if (isHttpErrorStatus(feedbackError, 404)) {
          myFeedback.value = null;
        } else {
          throw feedbackError;
        }
      }
    } catch (loadError) {
      error.value = getApiErrorMessage(loadError, FEEDBACK_MESSAGES.loadMineFailed);
    } finally {
      isLoading.value = false;
    }
  };

  const setLocalFeedback = (feedback: TFeedback | null) => {
    myFeedback.value = feedback;
  };

  watch(
    [normalizedProductId, isLogin, () => getEntityId(user.value), isAdmin],
    async () => {
      await fetchMyFeedback();
    },
    { immediate: true },
  );

  return {
    canManageFeedback,
    error,
    fetchMyFeedback,
    hasPurchased,
    eligiblePurchaseOrderId,
    isLoading,
    matchedOrder,
    matchedPurchaseItems,
    myFeedback,
    purchasedOptionLabels,
    setLocalFeedback,
  };
}
