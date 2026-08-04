import type { TCreateTagPayload, TExistedTag, TUpdateTagPayload } from "~/types/tag.type";

const createTagRepository = ($api: typeof $fetch) => ({
  getTags: () =>
    $api<TExistedTag[]>("/tags", {
      method: "GET",
    }),

  getTagById: (id: number) =>
    $api<TExistedTag>(`/tags/${id}`, {
      method: "GET",
    }),

  createTag: (payload: TCreateTagPayload) =>
    $api<TExistedTag>("/tags", {
      method: "POST",
      body: payload,
    }),

  updateTag: (id: number, payload: TUpdateTagPayload) =>
    $api<TExistedTag>(`/tags/${id}`, {
      method: "PATCH",
      body: payload,
    }),

  deleteTag: (id: number) =>
    $api<void>(`/tags/${id}`, {
      method: "DELETE",
    }),
});

export default createTagRepository;
