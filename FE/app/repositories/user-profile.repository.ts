import type { TAddress, TUser } from "~/types/user.type";

type TUpdateProfilePayload = {
  name?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  addresses?: TAddress[];
};

type TChangeEmailPayload = {
  newEmail: string;
  currentPassword: string;
};

type TChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

const createUserProfileRepository = ($api: typeof $fetch) => ({
  getProfile: () =>
    $api<TUser>("/users/profile", {
      method: "get",
    }),
  updateProfile: (body: TUpdateProfilePayload) =>
    $api<TUser>("/users/profile", {
      method: "patch",
      body,
    }),
  updateEmail: (body: TChangeEmailPayload) =>
    $api<TUser>("/users/profile/email", {
      method: "patch",
      body,
    }),
  updatePassword: (body: TChangePasswordPayload) =>
    $api<{ success: boolean }>("/users/profile/password", {
      method: "patch",
      body,
    }),
  createAddress: (body: TAddress) =>
    $api<TAddress>("/users/profile/addresses", {
      method: "post",
      body,
    }),
  updateAddress: (addressId: string, body: TAddress) =>
    $api<TAddress>(`/users/profile/addresses/${addressId}`, {
      method: "patch",
      body,
    }),
  setDefaultAddress: (addressId: string) =>
    $api<TAddress>(`/users/profile/addresses/${addressId}/default`, {
      method: "patch",
    }),
  deleteAddress: (addressId: string) =>
    $api<{ success: boolean }>(`/users/profile/addresses/${addressId}`, {
      method: "delete",
    }),
});

export default createUserProfileRepository;
