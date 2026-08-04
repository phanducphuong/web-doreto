import type {
  TUser,
  TUserManagementQueryParams,
  TUserManagementResponse,
} from "~/types/user.type";

type TUpdateManagementUserPayload = {
  name?: string;
  phoneNumber?: string;
  avatarUrl?: string;
};

const createUserManagementRepository = ($api: typeof $fetch) => ({
  getManagementUsers: (params: TUserManagementQueryParams) =>
    $api<TUserManagementResponse>("/users/management", {
      method: "get",
      params,
    }),
  getUserById: (id: string | number) =>
    $api<TUser>(`/users/${id}`, {
      method: "get",
    }),
  updateUserById: (id: string | number, body: TUpdateManagementUserPayload) =>
    $api<TUser>(`/users/${id}`, {
      method: "patch",
      body,
    }),
});

export default createUserManagementRepository;
