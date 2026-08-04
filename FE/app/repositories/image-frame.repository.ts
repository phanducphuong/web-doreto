import type { TPaginateResponse } from "~/types/fetch.type";
import type {
  TActiveImageFrame,
  TCreateImageFramePayload,
  TExistedImageFrame,
  TFilterImageFrameQuery,
  TUpdateImageFramePayload,
} from "~/types/image-frame.type";

const createImageFrameRepository = ($api: typeof $fetch) => ({
  getActiveFrames: () =>
    $api<TActiveImageFrame[]>("/image-frames/active", {
      method: "GET",
    }),

  getFrames: (query?: TFilterImageFrameQuery) =>
    $api<TExistedImageFrame[] | TPaginateResponse<TExistedImageFrame>>("/image-frames", {
      method: "GET",
      query,
    }),

  getFrameById: (id: number) =>
    $api<TExistedImageFrame>(`/image-frames/${id}`, {
      method: "GET",
    }),

  createFrame: (payload: TCreateImageFramePayload) =>
    $api<TExistedImageFrame>("/image-frames", {
      method: "POST",
      body: payload,
    }),

  updateFrame: (id: number, payload: TUpdateImageFramePayload) =>
    $api<TExistedImageFrame>(`/image-frames/${id}`, {
      method: "PATCH",
      body: payload,
    }),

  deleteFrame: (id: number) =>
    $api<TExistedImageFrame>(`/image-frames/${id}`, {
      method: "DELETE",
    }),
});

export default createImageFrameRepository;
