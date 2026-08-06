import type { TPaginateRequest, TPaginateResponse } from "./fetch.type";
import type { TTrackingUtm } from "./tracking.type";

export type TContactRequest = {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  done: boolean;
  doneAt?: string;
  createdAt: string;
};

export type TSpamBlock = {
  kind: "email" | "phone";
  value: string;
};

export type TCreateContactDto = {
  name: string;
  phone?: string;
  email?: string;
  // Attribution first-touch (phase 37) — optional, gửi kèm khi tạo liên hệ (D-05).
  visitorId?: string;
  camp?: string;
  utm?: TTrackingUtm;
};

export type TMarkSpamDto = {
  blockEmail: boolean;
  blockPhone: boolean;
};

export type TAddSpamBlockDto = {
  kind: "email" | "phone";
  value: string;
};

export type TContactListQueryParams = TPaginateRequest & {
  done?: boolean;
};

export type TSpamBlocklistQueryParams = TPaginateRequest;

export type TContactListResponse = TPaginateResponse<TContactRequest>;
export type TSpamBlocklistResponse = TPaginateResponse<TSpamBlock>;
