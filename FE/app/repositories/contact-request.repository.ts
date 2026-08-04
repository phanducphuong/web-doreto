import type {
  TAddSpamBlockDto,
  TContactListQueryParams,
  TContactListResponse,
  TCreateContactDto,
  TMarkSpamDto,
  TSpamBlocklistQueryParams,
  TSpamBlocklistResponse,
} from "~/types/contact-request.type";

export const createContactRequestRepository = ($api: typeof $fetch) => ({
  createContact: (body: TCreateContactDto) =>
    $api("/contact-requests", {
      method: "POST",
      body,
    }),

  getContacts: (params: TContactListQueryParams) =>
    $api<TContactListResponse>("/contact-requests", {
      method: "GET",
      query: {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        ...(params.done !== undefined ? { done: params.done } : {}),
      },
    }),

  setDone: (id: string, done: boolean) =>
    $api(`/contact-requests/${id}/done`, {
      method: "PATCH",
      body: { done },
    }),

  markSpam: (id: string, payload: TMarkSpamDto) =>
    $api(`/contact-requests/${id}/spam`, {
      method: "POST",
      body: payload,
    }),

  getSpamList: (params: TSpamBlocklistQueryParams) =>
    $api<TSpamBlocklistResponse>("/contact-requests/spam-blocklist", {
      method: "GET",
      query: {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
      },
    }),

  addSpam: (payload: TAddSpamBlockDto) =>
    $api("/contact-requests/spam-blocklist", {
      method: "POST",
      body: payload,
    }),

  removeSpam: (kind: "email" | "phone", value: string) =>
    $api("/contact-requests/spam-blocklist", {
      method: "DELETE",
      query: { kind, value },
    }),
});
