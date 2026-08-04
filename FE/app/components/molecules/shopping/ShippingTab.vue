<template>
  <div>
    <div class="flex flex-col gap-3 sm:gap-6 lg:grid lg:grid-cols-12 lg:gap-10 xl:gap-12">
      <div class="order-2 space-y-4 sm:space-y-8 lg:order-none lg:col-span-7 lg:space-y-10">
        <section v-if="isLogin && savedAddresses.length">
          <MoleculesCollapsible :default-open="false">
            <template #trigger="{ isOpen }">
              <div class="flex w-full cursor-pointer items-start justify-between gap-3 sm:gap-4">
                <div class="flex min-w-0 items-start gap-2 sm:gap-3">
                  <span
                    class="mt-1.5 h-5 w-1.5 shrink-0 rounded-full bg-primary sm:(mt-2 h-6)"
                  ></span>
                  <div class="min-w-0">
                    <h2 class="text-xl headline-md text-on-surface sm:text-2xl">
                      Chọn địa chỉ đã lưu
                    </h2>
                    <p class="mt-1 text-xs text-on-surface-variant sm:(mt-1.5 text-sm)">
                      Có {{ savedAddresses.length }} địa chỉ đã lưu
                    </p>
                  </div>
                </div>
                <ChevronDown
                  class="mt-1.5 size-5 shrink-0 text-on-surface-variant transition-transform duration-200 sm:mt-2"
                  :class="{ 'rotate-180': isOpen }"
                />
              </div>
            </template>

            <div class="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
              <div
                v-for="address in savedAddresses"
                :key="address._id || address.address"
                class="rounded-2xl border p-4 transition"
                :class="
                  selectedAddressId === address._id
                    ? 'border-primary bg-primary/5'
                    : 'border-outline-variant bg-surface'
                "
              >
                <div class="mb-2 flex items-center gap-2">
                  <span
                    v-if="address.isDefault"
                    class="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
                  >
                    Mặc định
                  </span>
                </div>
                <p class="font-semibold">{{ address.name }}</p>
                <p class="text-sm text-on-surface-variant">{{ address.phoneNumber }}</p>
                <p class="mt-2 text-sm text-on-surface-variant">
                  {{ address.address }}
                </p>
                <AtomsButton
                  class="mt-3 w-full"
                  type="outline"
                  @click="selectAddressForOrder(address)"
                >
                  Sử dụng địa chỉ này
                </AtomsButton>
              </div>
            </div>
          </MoleculesCollapsible>
        </section>

        <section>
          <div class="grid grid-cols-1 gap-2.5 sm:gap-5 md:grid-cols-2 md:gap-6">
            <div class="md:col-span-2">
              <AtomsFormItem label="Họ và tên" :error-message="errors.name" required>
                <AtomsFormInput
                  v-model="shippingForm.name"
                  class="w-full"
                  placeholder="Nguyễn Văn A"
                  maxlength="200"
                  :error="errors.name"
                />
              </AtomsFormItem>
            </div>

            <div class="md:col-span-2">
              <AtomsFormItem label="Số điện thoại" :error-message="errors.phoneNumber" required>
                <AtomsFormInput
                  v-model="shippingForm.phoneNumber"
                  class="w-full"
                  placeholder="0912345678"
                  type="tel"
                  maxlength="20"
                  :error="errors.phoneNumber"
                />
              </AtomsFormItem>
            </div>

            <div class="md:col-span-2">
              <AtomsFormItem label="Địa chỉ giao hàng" :error-message="errors.address" required>
                <AtomsFormTextArea
                  v-model="shippingForm.address"
                  class="w-full"
                  placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố..."
                  :rows="2"
                  :maxlength="500"
                  :error="errors.address"
                />
              </AtomsFormItem>
            </div>
          </div>
        </section>

        <div
          class="hidden items-start gap-3 rounded-xl border border-tertiary/10 bg-tertiary-fixed p-4 sm:(gap-4 p-6) lg:flex"
        >
          <InfoIcon />
          <div>
            <h4
              class="mb-1 text-12px font-bold uppercase tracking-tight text-white-fixed sm:text-sm"
            >
              Đảm bảo tính bảo mật thông tin khách hàng
            </h4>
            <p class="text-xs leading-relaxed text-white-fixed-variant sm:text-sm">
              Chúng tôi sẽ liên hệ lại để xác nhận thông tin đơn hàng sớm nhất có thể.
            </p>
          </div>
        </div>
      </div>

      <MoleculesShoppingOrderSummary
        :step="2"
        class="order-1 lg:order-none lg:col-span-5"
        @submit="handleSubmit"
      />

      <div
        class="order-4 flex items-start gap-3 rounded-xl border border-tertiary/10 bg-tertiary-fixed p-3 sm:(gap-4 p-6) lg:hidden"
      >
        <InfoIcon />
        <div>
          <h4 class="mb-0.5 text-12px font-bold uppercase tracking-tight text-white-fixed sm:(mb-1 text-sm)">
            Đảm bảo tính bảo mật thông tin khách hàng
          </h4>
          <p class="text-xs leading-normal text-white-fixed-variant sm:(text-sm leading-relaxed)">
            Chúng tôi sẽ liên hệ lại để xác nhận thông tin đơn hàng sớm nhất có thể.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MoleculesShoppingOrderSummary } from "#components";
import { ChevronDown, InfoIcon } from "lucide-vue-next";
import type { TAddress } from "~/types/user.type";
import { normalizeVnPhoneNumber, validateVnPhoneNumber } from "~/utils/phone.utils";

type TShippingForm = {
  name: string;
  phoneNumber: string;
  address: string;
};

type TShippingFormError = Partial<Record<keyof TShippingForm, string>>;

const { user } = storeToRefs(useAuthStore());
const isLogin = computed(() => Boolean(user.value?._id));
const { submitPurchaseOrder, removeOrderedItemsFromCart, setBuyNowItem, setLastBuyNowKey } =
  usePurchaseOrderStore();
const { buyNowItem } = storeToRefs(usePurchaseOrderStore());
const { $userProfileRepository } = useNuxtApp();
const toast = useToast();

const emit = defineEmits<{
  onSubmitCartSuccess: [order: Awaited<ReturnType<typeof submitPurchaseOrder>>];
}>();
const SHIPPING_FORM_STORAGE_KEY = "shippingFormDraft";

const shippingForm = reactive<TShippingForm>({
  name: "",
  phoneNumber: "",
  address: "",
});
const savedAddresses = ref<TAddress[]>([]);
const selectedAddressId = ref<string>("");

watchEffect(() => {
  if (!shippingForm.name && user.value?.name) {
    shippingForm.name = user.value.name;
  }

  if (!shippingForm.phoneNumber && user.value?.phoneNumber) {
    shippingForm.phoneNumber = user.value.phoneNumber;
  }
});

const errors = ref<TShippingFormError>({});

const getShippingFormSnapshot = (): TShippingForm => ({
  name: shippingForm.name,
  phoneNumber: shippingForm.phoneNumber,
  address: shippingForm.address,
});

const saveShippingFormToLocalStorage = () => {
  if (!import.meta.client) return;
  localStorage.setItem(SHIPPING_FORM_STORAGE_KEY, JSON.stringify(getShippingFormSnapshot()));
};

const loadShippingFormFromLocalStorage = () => {
  if (!import.meta.client) return;
  const rawValue = localStorage.getItem(SHIPPING_FORM_STORAGE_KEY);
  if (!rawValue) return;

  try {
    const parsed = JSON.parse(rawValue) as Partial<TShippingForm>;
    shippingForm.name = parsed.name || "";
    shippingForm.phoneNumber = parsed.phoneNumber || "";
    shippingForm.address = parsed.address || "";
  } catch (error) {
    console.error("Failed to parse shipping form from localStorage", error);
  }
};

onMounted(() => {
  loadShippingFormFromLocalStorage();
  loadSavedAddresses();
});

const loadSavedAddresses = async () => {
  if (!isLogin.value) return;
  try {
    const profile = await $userProfileRepository.getProfile();
    savedAddresses.value = profile.addresses || [];
    const defaultAddress = savedAddresses.value.find((address) => address.isDefault);
    if (defaultAddress?._id) {
      selectedAddressId.value = defaultAddress._id;
      selectAddressForOrder(defaultAddress);
    }
  } catch (error) {
    console.error("Load saved addresses failed", error);
  }
};

const selectAddressForOrder = (address: TAddress) => {
  if (address._id) {
    selectedAddressId.value = address._id;
  }
  shippingForm.name = address.name;
  shippingForm.phoneNumber = address.phoneNumber;
  shippingForm.address = address.address;
};

const buildOrderAddress = (): TAddress => ({
  name: shippingForm.name.trim(),
  phoneNumber: normalizeVnPhoneNumber(shippingForm.phoneNumber),
  address: shippingForm.address.trim(),
});

const handleSubmit = async () => {
  const isBuyNowCheckout = Boolean(buyNowItem.value);

  errors.value = validateShippingForm(shippingForm);
  if (Object.keys(errors.value).length > 0) return;

  saveShippingFormToLocalStorage();
  const res = await submitPurchaseOrder({ address: buildOrderAddress() });
  if (res) {
    toast.success({ message: "Gửi đơn hàng thành công. Hãy chờ nhân viên liên hệ xác nhận" });
    if (isBuyNowCheckout) {
      setBuyNowItem(null);
    } else {
      // Chỉ xóa những sản phẩm đã đặt; sản phẩm bỏ tick vẫn giữ trong giỏ
      removeOrderedItemsFromCart();
    }
    setLastBuyNowKey(null);
    emit("onSubmitCartSuccess", res);
  } else {
    toast.error({ message: "Gửi đơn hàng thất bại" });
  }
};

const validateShippingForm = (data: TShippingForm): TShippingFormError => {
  const formErrors: TShippingFormError = {};

  if (!data.name || data.name.trim() === "") {
    formErrors.name = "Tên người nhận là bắt buộc";
  } else if (data.name.trim().length < 2) {
    formErrors.name = "Tên phải ít nhất 2 ký tự";
  } else if (data.name.trim().length > 200) {
    formErrors.name = "Tên không được vượt quá 200 ký tự";
  }

  const phoneError = validateVnPhoneNumber(data.phoneNumber);
  if (phoneError) {
    formErrors.phoneNumber = phoneError;
  }

  if (!data.address || data.address.trim() === "") {
    formErrors.address = "Địa chỉ giao hàng là bắt buộc";
  } else if (data.address.trim().length < 5) {
    formErrors.address = "Địa chỉ quá ngắn";
  } else if (data.address.trim().length > 500) {
    formErrors.address = "Địa chỉ không được vượt quá 500 ký tự";
  }

  return formErrors;
};
</script>
