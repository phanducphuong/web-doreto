import {
  DEFAULT_UPLOAD_COMPRESSION_PRESET,
  type TMediaCompressionPreset,
} from "~/constants/media-compression.constant";
import { FEEDBACK_MESSAGES } from "~/constants/feedback.constant";
import { getApiErrorMessage } from "~/utils/api-error";
import { compressImageFiles } from "~/utils/media-compression.utils";

export type TUploadFilesOptions = {
  preset?: TMediaCompressionPreset;
  compress?: boolean;
};

export default function useUploadFiles() {
  const { $uploadRepository } = useNuxtApp();

  const isUploading = ref(false);
  const error = ref("");

  const uploadFiles = async (files: File[], options?: TUploadFilesOptions): Promise<string[]> => {
    if (!files.length) return [];

    try {
      isUploading.value = true;
      error.value = "";

      const shouldCompress = options?.compress !== false;
      const preset = options?.preset ?? DEFAULT_UPLOAD_COMPRESSION_PRESET;
      const preparedFiles = shouldCompress ? await compressImageFiles(files, preset) : files;

      const response = await $uploadRepository.uploadFiles(preparedFiles);
      return response.data.map((file) => file.url);
    } catch (uploadError) {
      error.value = getApiErrorMessage(uploadError, FEEDBACK_MESSAGES.uploadFailed);
      throw new Error(error.value);
    } finally {
      isUploading.value = false;
    }
  };

  return {
    error,
    isUploading,
    uploadFiles,
  };
}
