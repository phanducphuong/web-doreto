import type { TPaginateResponse } from "~/types/fetch.type";
import type {
  TCreateImageFramePayload,
  TExistedImageFrame,
  TFilterImageFrameQuery,
  TImageFrameFormError,
  TUpdateImageFramePayload,
} from "~/types/image-frame.type";

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

function getImageFrameActionErrorMessage(error: unknown): string {
  const status = getErrorStatus(error);

  if (status === 401) return "Unauthorized action";
  if (status === 403) return "Forbidden action";
  if (status === 404) return "Image frame not found";
  return "Request failed, please try again";
}

function isPaginatedFrames(
  response: TExistedImageFrame[] | TPaginateResponse<TExistedImageFrame>,
): response is TPaginateResponse<TExistedImageFrame> {
  return !Array.isArray(response) && Array.isArray(response.data);
}

export default function useImageFrame() {
  const toast = useToast();
  const { $imageFrameRepository } = useNuxtApp();

  const loadingStates = ref({
    fetch: false,
    fetchActive: false,
    upsert: false,
    delete: false,
    getById: false,
  });

  const frames = ref<TExistedImageFrame[]>([]);
  const fetchError = ref("");
  const operationError = ref("");

  const validateImageFrameForm = (payload: Partial<TCreateImageFramePayload>): TImageFrameFormError => {
    const errors: TImageFrameFormError = {};

    if (!payload.name || typeof payload.name !== "string" || payload.name.trim() === "") {
      errors.name = "Tên khung là bắt buộc";
    }

    if (!payload.imageUrl || typeof payload.imageUrl !== "string" || payload.imageUrl.trim() === "") {
      errors.imageUrl = "Ảnh khung là bắt buộc";
    }

    const insetFields = ["insetTop", "insetRight", "insetBottom", "insetLeft"] as const;
    insetFields.forEach((field) => {
      const value = payload[field];
      if (value === undefined || value === null) return;
      if (typeof value !== "number" || Number.isNaN(value) || value < 0 || value > 50) {
        errors[field] = "Inset phải từ 0 đến 50";
      }
    });

    if (
      payload.sortOrder !== undefined &&
      payload.sortOrder !== null &&
      (typeof payload.sortOrder !== "number" || Number.isNaN(payload.sortOrder) || payload.sortOrder < 0)
    ) {
      errors.sortOrder = "Sort order phải là số >= 0";
    }

    return errors;
  };

  const fetchFrames = async (query?: TFilterImageFrameQuery) => {
    try {
      loadingStates.value.fetch = true;
      fetchError.value = "";
      const response = await $imageFrameRepository.getFrames(query);
      frames.value = isPaginatedFrames(response) ? response.data : response;
    } catch (error) {
      console.error(error);
      fetchError.value = getImageFrameActionErrorMessage(error);
    } finally {
      loadingStates.value.fetch = false;
    }
  };

  const fetchActiveFrames = async () => {
    try {
      loadingStates.value.fetchActive = true;
      return await $imageFrameRepository.getActiveFrames();
    } catch (error) {
      console.error(error);
      toast.error({ message: getImageFrameActionErrorMessage(error) });
      return [];
    } finally {
      loadingStates.value.fetchActive = false;
    }
  };

  const getFrameById = async (id: string) => {
    try {
      loadingStates.value.getById = true;
      operationError.value = "";
      return await $imageFrameRepository.getFrameById(id);
    } catch (error) {
      console.error(error);
      operationError.value = getImageFrameActionErrorMessage(error);
      toast.error({ message: operationError.value });
      return null;
    } finally {
      loadingStates.value.getById = false;
    }
  };

  const createFrame = async (payload: TCreateImageFramePayload) => {
    try {
      loadingStates.value.upsert = true;
      operationError.value = "";
      const response = await $imageFrameRepository.createFrame(payload);
      toast.success({ message: "Tạo khung ảnh thành công" });
      return response;
    } catch (error) {
      console.error(error);
      operationError.value = getImageFrameActionErrorMessage(error);
      toast.error({ message: operationError.value });
      return null;
    } finally {
      loadingStates.value.upsert = false;
    }
  };

  const updateFrame = async (id: string, payload: TUpdateImageFramePayload) => {
    try {
      loadingStates.value.upsert = true;
      operationError.value = "";
      const response = await $imageFrameRepository.updateFrame(id, payload);
      toast.success({ message: "Cập nhật khung ảnh thành công" });
      return response;
    } catch (error) {
      console.error(error);
      operationError.value = getImageFrameActionErrorMessage(error);
      toast.error({ message: operationError.value });
      return null;
    } finally {
      loadingStates.value.upsert = false;
    }
  };

  const deleteFrame = async (id: string) => {
    try {
      loadingStates.value.delete = true;
      operationError.value = "";
      await $imageFrameRepository.deleteFrame(id);
      toast.success({ message: "Đã vô hiệu hóa khung ảnh" });
      return true;
    } catch (error) {
      console.error(error);
      operationError.value = getImageFrameActionErrorMessage(error);
      toast.error({ message: operationError.value });
      return false;
    } finally {
      loadingStates.value.delete = false;
    }
  };

  return {
    frames,
    fetchError,
    operationError,
    loadingStates,
    validateImageFrameForm,
    fetchFrames,
    fetchActiveFrames,
    getFrameById,
    createFrame,
    updateFrame,
    deleteFrame,
  };
}
