<template>
  <section class="px-4 mx-auto w-[min(100%,640px)]">
    <div class="mb-6">
      <h1 class="cms-title">Trang cá nhân</h1>
      <p class="mt-1 text-sm text-outline">
        Quản lý thông tin cá nhân, địa chỉ và bảo mật tài khoản.
      </p>
    </div>

    <div class="mb-4 flex flex-wrap gap-2">
      <AtomsButton
        v-for="item in tabs"
        :key="item.key"
        :type="activeTab === item.key ? 'primary' : 'outline'"
        @click="activeTab = item.key"
      >
        {{ item.label }}
      </AtomsButton>
    </div>

    <div class="rounded-2xl border border-outline-variant bg-surface p-4 md:p-6">
      <AtomsUiInlineError :message="pageError" class="mb-4" />

      <div v-if="activeTab === 'profile'" class="space-y-4">
        <AtomsFormItem label="Họ tên">
          <AtomsFormInput v-model="profileForm.name" placeholder="Nhập họ tên" class="w-full" />
        </AtomsFormItem>
        <AtomsFormItem label="Số điện thoại">
          <AtomsFormInput
            v-model="profileForm.phoneNumber"
            placeholder="Nhập số điện thoại"
            class="w-full"
          />
        </AtomsFormItem>
        <AtomsFormItem label="Avatar URL">
          <AtomsFormInput
            v-model="profileForm.avatarUrl"
            placeholder="https://..."
            class="w-full"
          />
        </AtomsFormItem>
        <div class="pt-2">
          <AtomsButton :disabled="isSavingProfile" @click="onSaveProfile"
            >Lưu thông tin</AtomsButton
          >
        </div>
      </div>

      <div v-else-if="activeTab === 'addresses'" class="space-y-5">
        <div class="space-y-3">
          <h3 class="text-lg font-semibold">Danh sách địa chỉ</h3>
          <div
            v-for="address in profile.addresses"
            :key="address._id || address.address"
            class="rounded-xl border border-outline-variant p-4"
          >
            <div class="flex items-center gap-2">
              <p class="font-medium">{{ address.name }}</p>
              <span
                v-if="address.isDefault"
                class="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
              >
                Mặc định
              </span>
            </div>
            <p class="text-sm text-outline">{{ address.phoneNumber }}</p>
            <p class="text-sm text-outline">
              {{ address.address }}
            </p>
            <div class="mt-3 flex gap-2">
              <AtomsButton
                type="primary"
                :disabled="isSavingAddress || address.isDefault"
                @click="onSetDefaultAddress(address)"
              >
                Sử dụng địa chỉ này
              </AtomsButton>
              <AtomsButton type="outline" @click="onEditAddress(address)">Sửa</AtomsButton>
              <AtomsButton type="ghost" @click="onDeleteAddress(address)">Xóa</AtomsButton>
            </div>
          </div>
          <p v-if="!profile.addresses.length" class="text-sm text-outline">Chưa có địa chỉ nào.</p>
        </div>

        <div class="rounded-xl border border-outline-variant p-4">
          <h3 class="mb-3 text-base font-semibold">
            {{ editingAddressId ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới" }}
          </h3>
          <div class="grid grid-cols-1 gap-3">
            <AtomsFormItem label="Tên người nhận">
              <AtomsFormInput
                v-model="addressForm.name"
                placeholder="Nguyễn Văn A"
                class="w-full"
                maxlength="200"
              />
            </AtomsFormItem>
            <AtomsFormItem label="Số điện thoại">
              <AtomsFormInput
                v-model="addressForm.phoneNumber"
                placeholder="0912345678"
                class="w-full"
                maxlength="20"
              />
            </AtomsFormItem>
            <AtomsFormItem label="Địa chỉ giao hàng">
              <AtomsFormTextArea
                v-model="addressForm.address"
                placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố..."
                class="w-full"
                :rows="3"
                :maxlength="500"
              />
            </AtomsFormItem>
          </div>
          <label
            class="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm text-on-surface-variant"
          >
            <input
              v-model="addressForm.isDefault"
              type="checkbox"
              class="rounded border-outline-variant"
            />
            Đặt làm địa chỉ mặc định
          </label>
          <div class="mt-4 flex gap-2">
            <AtomsButton :disabled="isSavingAddress" @click="onSaveAddress">
              {{ editingAddressId ? "Cập nhật địa chỉ" : "Thêm địa chỉ" }}
            </AtomsButton>
            <AtomsButton
              v-if="editingAddressId"
              type="outline"
              :disabled="isSavingAddress"
              @click="resetAddressForm"
            >
              Hủy
            </AtomsButton>
          </div>
        </div>
      </div>

      <div v-else class="space-y-6">
        <div class="rounded-xl border border-outline-variant p-4">
          <h3 class="mb-3 text-base font-semibold">Đổi email</h3>
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <AtomsFormItem label="Email mới">
              <AtomsFormInput
                v-model="emailForm.newEmail"
                type="email"
                placeholder="new@email.com"
                class="w-full"
              />
            </AtomsFormItem>
            <AtomsFormItem label="Mật khẩu hiện tại">
              <AtomsFormInput
                v-model="emailForm.currentPassword"
                type="password"
                placeholder="Nhập mật khẩu hiện tại"
                class="w-full"
              />
            </AtomsFormItem>
          </div>
          <div class="mt-4">
            <AtomsButton :disabled="isSavingEmail" @click="onChangeEmail"
              >Cập nhật email</AtomsButton
            >
          </div>
        </div>

        <div class="rounded-xl border border-outline-variant p-4">
          <h3 class="mb-3 text-base font-semibold">Đổi mật khẩu</h3>
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <AtomsFormItem label="Mật khẩu hiện tại">
              <AtomsFormInput
                v-model="passwordForm.currentPassword"
                type="password"
                placeholder="Nhập mật khẩu hiện tại"
                class="w-full"
              />
            </AtomsFormItem>
            <AtomsFormItem label="Mật khẩu mới">
              <AtomsFormInput
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="Ít nhất 6 ký tự"
                class="w-full"
              />
            </AtomsFormItem>
          </div>
          <div class="mt-4">
            <AtomsButton :disabled="isSavingPassword" @click="onChangePassword"
              >Cập nhật mật khẩu</AtomsButton
            >
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { TAddress, TUser } from "~/types/user.type";
import { getApiErrorMessage } from "~/utils/api-error";
import { normalizeVnPhoneNumber, validateVnPhoneNumber } from "~/utils/phone.utils";

type TTab = "profile" | "addresses" | "security";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

useSeoMeta({
  title: "Trang cá nhân | Doreto",
  description: "Quản lý thông tin cá nhân, địa chỉ nhận hàng và bảo mật tài khoản của bạn.",
});

useBreadcrumbSchema([
  { name: "Trang chủ", path: "/" },
  { name: "Trang cá nhân", path: "/profile" },
]);

const { $userProfileRepository, $event } = useNuxtApp();
const toast = useToast();
const authStore = useAuthStore();

const tabs: { key: TTab; label: string }[] = [
  { key: "profile", label: "Thông tin cá nhân" },
  { key: "addresses", label: "Địa chỉ" },
  { key: "security", label: "Bảo mật" },
];

const activeTab = ref<TTab>("profile");
const pageError = ref("");
const profile = reactive<TUser>({
  id: "",
  name: "",
  email: "",
  role: "customer" as TUser["role"],
  avatarUrl: "",
  phoneNumber: "",
  addresses: [],
});

const profileForm = reactive({
  name: "",
  phoneNumber: "",
  avatarUrl: "",
});

const addressForm = reactive<TAddress>({
  isDefault: false,
  name: "",
  phoneNumber: "",
  address: "",
});

const emailForm = reactive({
  newEmail: "",
  currentPassword: "",
});

const passwordForm = reactive({
  currentPassword: "",
  newPassword: "",
});

const editingAddressId = ref<string>("");

const isSavingProfile = ref(false);
const isSavingAddress = ref(false);
const isSavingEmail = ref(false);
const isSavingPassword = ref(false);

const syncProfileForm = () => {
  profileForm.name = profile.name || "";
  profileForm.phoneNumber = profile.phoneNumber || "";
  profileForm.avatarUrl = profile.avatarUrl || "";
};

const fillAddressForm = (address?: TAddress) => {
  addressForm.isDefault = Boolean(address?.isDefault);
  addressForm.name = address?.name || "";
  addressForm.phoneNumber = address?.phoneNumber || "";
  addressForm.address = address?.address || "";
};

const resetAddressForm = () => {
  editingAddressId.value = "";
  fillAddressForm();
};

const mapBackendError = (error: unknown, fallback: string) => {
  const message = getApiErrorMessage(error, fallback);
  if (/current password|mật khẩu hiện tại|incorrect password|wrong password/i.test(message)) {
    return "Mật khẩu hiện tại không đúng.";
  }
  if (/email.*exist|email.*taken|duplicate|trùng email/i.test(message)) {
    return "Email đã tồn tại.";
  }
  if (/address.*not found|địa chỉ.*không tồn tại/i.test(message)) {
    return "Địa chỉ không tồn tại hoặc đã bị xóa.";
  }
  return message;
};

const requireLogin = () => {
  if (authStore.isLogin) return true;
  $event("auth:open-sign-modal", { type: "sign-in" });
  navigateTo("/");
  return false;
};

const fetchProfile = async () => {
  try {
    pageError.value = "";
    const res = await $userProfileRepository.getProfile();
    Object.assign(profile, res, {
      addresses: res.addresses || [],
    });
    syncProfileForm();
    authStore.user = res;
  } catch (error) {
    pageError.value = mapBackendError(error, "Không thể tải thông tin cá nhân.");
  }
};

const onSaveProfile = async () => {
  try {
    isSavingProfile.value = true;
    pageError.value = "";
    const res = await $userProfileRepository.updateProfile({
      name: profileForm.name.trim(),
      phoneNumber: profileForm.phoneNumber.trim(),
      avatarUrl: profileForm.avatarUrl.trim(),
    });
    Object.assign(profile, res, { addresses: res.addresses || [] });
    authStore.user = res;
    toast.success({ message: "Đã cập nhật thông tin cá nhân." });
  } catch (error) {
    toast.error({ message: mapBackendError(error, "Cập nhật thông tin thất bại.") });
  } finally {
    isSavingProfile.value = false;
  }
};

const validateAddressForm = () => {
  if (!addressForm.name.trim()) {
    toast.error({ message: "Vui lòng nhập tên người nhận." });
    return false;
  }
  if (addressForm.name.trim().length > 200) {
    toast.error({ message: "Tên không được vượt quá 200 ký tự." });
    return false;
  }
  const phoneError = validateVnPhoneNumber(addressForm.phoneNumber);
  if (phoneError) {
    toast.error({ message: phoneError });
    return false;
  }
  if (!addressForm.address.trim()) {
    toast.error({ message: "Vui lòng nhập địa chỉ giao hàng." });
    return false;
  }
  if (addressForm.address.trim().length > 500) {
    toast.error({ message: "Địa chỉ không được vượt quá 500 ký tự." });
    return false;
  }
  return true;
};

const onSaveAddress = async () => {
  if (!validateAddressForm()) return;
  try {
    isSavingAddress.value = true;
    pageError.value = "";
    const payload: TAddress = {
      isDefault: Boolean(addressForm.isDefault),
      name: addressForm.name.trim(),
      phoneNumber: normalizeVnPhoneNumber(addressForm.phoneNumber),
      address: addressForm.address.trim(),
    };
    if (editingAddressId.value) {
      await $userProfileRepository.updateAddress(editingAddressId.value, payload);
      toast.success({ message: "Đã cập nhật địa chỉ." });
    } else {
      await $userProfileRepository.createAddress(payload);
      toast.success({ message: "Đã thêm địa chỉ mới." });
    }
    resetAddressForm();
    await fetchProfile();
  } catch (error) {
    toast.error({ message: mapBackendError(error, "Thao tác địa chỉ thất bại.") });
  } finally {
    isSavingAddress.value = false;
  }
};

const onEditAddress = (address: TAddress) => {
  if (!address._id) {
    toast.error({ message: "Địa chỉ không hợp lệ để cập nhật." });
    return;
  }
  editingAddressId.value = address._id;
  fillAddressForm(address);
};

const onDeleteAddress = async (address: TAddress) => {
  if (!address._id) {
    toast.error({ message: "Không thể xóa địa chỉ này." });
    return;
  }
  try {
    isSavingAddress.value = true;
    await $userProfileRepository.deleteAddress(address._id);
    toast.success({ message: "Đã xóa địa chỉ." });
    await fetchProfile();
  } catch (error) {
    toast.error({ message: mapBackendError(error, "Xóa địa chỉ thất bại.") });
  } finally {
    isSavingAddress.value = false;
  }
};

const onSetDefaultAddress = async (address: TAddress) => {
  if (!address._id) {
    toast.error({ message: "Không thể cập nhật địa chỉ mặc định." });
    return;
  }
  try {
    isSavingAddress.value = true;
    await $userProfileRepository.setDefaultAddress(address._id);
    toast.success({ message: "Đã cập nhật địa chỉ mặc định." });
    await fetchProfile();
  } catch (error) {
    toast.error({ message: mapBackendError(error, "Cập nhật địa chỉ mặc định thất bại.") });
  } finally {
    isSavingAddress.value = false;
  }
};

const onChangeEmail = async () => {
  const newEmail = emailForm.newEmail.trim();
  const currentPassword = emailForm.currentPassword;
  if (!EMAIL_REGEX.test(newEmail)) {
    toast.error({ message: "Email không đúng định dạng." });
    return;
  }
  if (!currentPassword) {
    toast.error({ message: "Vui lòng nhập mật khẩu hiện tại." });
    return;
  }
  try {
    isSavingEmail.value = true;
    await $userProfileRepository.updateEmail({
      newEmail,
      currentPassword,
    });
    toast.success({ message: "Đã cập nhật email." });
    emailForm.newEmail = "";
    emailForm.currentPassword = "";
    await fetchProfile();
  } catch (error) {
    toast.error({ message: mapBackendError(error, "Cập nhật email thất bại.") });
  } finally {
    isSavingEmail.value = false;
  }
};

const onChangePassword = async () => {
  const { currentPassword, newPassword } = passwordForm;
  if (!currentPassword) {
    toast.error({ message: "Vui lòng nhập mật khẩu hiện tại." });
    return;
  }
  if ((newPassword || "").length < 6) {
    toast.error({ message: "Mật khẩu mới tối thiểu 6 ký tự." });
    return;
  }
  try {
    isSavingPassword.value = true;
    await $userProfileRepository.updatePassword({
      currentPassword,
      newPassword,
    });
    toast.success({ message: "Đổi mật khẩu thành công." });
    passwordForm.currentPassword = "";
    passwordForm.newPassword = "";
  } catch (error) {
    toast.error({ message: mapBackendError(error, "Đổi mật khẩu thất bại.") });
  } finally {
    isSavingPassword.value = false;
  }
};

onMounted(async () => {
  if (!requireLogin()) return;
  await fetchProfile();
});
</script>
