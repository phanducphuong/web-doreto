import { ERole, type TUser } from "~/types/user.type";
import type {
  TCreateTagPayload,
  TExistedTag,
  TTagFormError,
  TUpdateTagPayload,
} from "~/types/tag.type";

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;

  if ("statusCode" in error && typeof (error as { statusCode: unknown }).statusCode === "number") {
    return (error as { statusCode: number }).statusCode;
  }

  if ("status" in error && typeof (error as { status: unknown }).status === "number") {
    return (error as { status: number }).status;
  }

  return undefined;
}

function getTagActionErrorMessage(error: unknown): string {
  const status = getErrorStatus(error);

  if (status === 409) return "Tag name already exists";
  if (status === 401) return "Unauthorized action";
  if (status === 403) return "Forbidden action";
  if (status === 404) return "Tag not found";
  return "Request failed, please try again";
}

export default function useTag() {
  const toast = useToast();
  const { $tagRepository } = useNuxtApp();
  const authStore = useAuthStore();

  const loadingStates = ref({
    fetch: false,
    upsert: false,
    delete: false,
    getById: false,
  });

  const tags = ref<TExistedTag[]>([]);
  const fetchError = ref<string>("");
  const operationError = ref<string>("");

  const validateTagForm = (payload: Partial<TCreateTagPayload>): TTagFormError => {
    const errors: TTagFormError = {};

    if (!payload.name || typeof payload.name !== "string" || payload.name.trim() === "") {
      errors.name = "Tag name is required";
    }

    if (payload.icon !== undefined && payload.icon !== null && typeof payload.icon !== "string") {
      errors.icon = "Icon must be a string";
    }

    if (
      payload.order !== undefined &&
      payload.order !== null &&
      (typeof payload.order !== "number" || Number.isNaN(payload.order))
    ) {
      errors.order = "Order must be a number";
    }

    return errors;
  };

  const fetchTags = async () => {
    try {
      loadingStates.value.fetch = true;
      fetchError.value = "";
      tags.value = await $tagRepository.getTags();
    } catch (error) {
      console.error(error);
      fetchError.value = getTagActionErrorMessage(error);
    } finally {
      loadingStates.value.fetch = false;
    }
  };

  const getTagById = async (id: number) => {
    try {
      loadingStates.value.getById = true;
      operationError.value = "";
      return await $tagRepository.getTagById(id);
    } catch (error) {
      console.error(error);
      operationError.value = getTagActionErrorMessage(error);
      toast.error({ message: operationError.value });
      return null;
    } finally {
      loadingStates.value.getById = false;
    }
  };

  const createTag = async (payload: TCreateTagPayload) => {
    try {
      loadingStates.value.upsert = true;
      operationError.value = "";
      const response = await $tagRepository.createTag(payload);
      toast.success({ message: "Create tag successfully" });
      return response;
    } catch (error) {
      console.error(error);
      operationError.value = getTagActionErrorMessage(error);
      toast.error({ message: operationError.value });
      return null;
    } finally {
      loadingStates.value.upsert = false;
    }
  };

  const updateTag = async (id: number, payload: TUpdateTagPayload) => {
    try {
      loadingStates.value.upsert = true;
      operationError.value = "";
      const response = await $tagRepository.updateTag(id, payload);
      toast.success({ message: "Update tag successfully" });
      return response;
    } catch (error) {
      console.error(error);
      operationError.value = getTagActionErrorMessage(error);
      toast.error({ message: operationError.value });
      return null;
    } finally {
      loadingStates.value.upsert = false;
    }
  };

  const deleteTag = async (id: number) => {
    try {
      loadingStates.value.delete = true;
      operationError.value = "";
      await $tagRepository.deleteTag(id);
      toast.success({ message: "Delete tag successfully" });
      return true;
    } catch (error) {
      console.error(error);
      operationError.value = getTagActionErrorMessage(error);
      toast.error({ message: operationError.value });
      return false;
    } finally {
      loadingStates.value.delete = false;
    }
  };

  return {
    tags,
    fetchError,
    operationError,
    loadingStates,
    validateTagForm,
    fetchTags,
    getTagById,
    createTag,
    updateTag,
    deleteTag,
  };
}
