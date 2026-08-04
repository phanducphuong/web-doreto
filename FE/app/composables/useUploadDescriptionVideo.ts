import type { TVideoCompleteResponse } from "~/types/video-upload.type";
import {
  getVideoUploadErrorMessage,
  putFileToPresignedUrl,
  resolveVideoContentType,
} from "~/utils/video-upload.utils";

export type TDescriptionVideoUploadPhase = "idle" | "uploading";

export type TDescriptionVideoUploadProgress = {
  phase: TDescriptionVideoUploadPhase;
  percent: number;
};

export type TUploadDescriptionVideoOptions = {
  onProgress?: (progress: TDescriptionVideoUploadProgress) => void;
  signal?: AbortSignal;
};

export default function useUploadDescriptionVideo() {
  const { $uploadRepository } = useNuxtApp();

  const isUploadingVideo = ref(false);
  const error = ref("");

  const uploadDescriptionVideo = async (
    sourceFile: File,
    options?: TUploadDescriptionVideoOptions,
  ): Promise<TVideoCompleteResponse> => {
    const sourceContentType = resolveVideoContentType(sourceFile);
    if (!sourceContentType) {
      throw new Error("Định dạng video không được hỗ trợ.");
    }

    try {
      isUploadingVideo.value = true;
      error.value = "";

      options?.onProgress?.({ phase: "uploading", percent: 0 });

      const presignResponse = await $uploadRepository.presignDescriptionVideo({
        fileName: sourceFile.name,
        contentType: sourceContentType,
        size: sourceFile.size,
      });

      const presignData = presignResponse.data;

      await putFileToPresignedUrl(sourceFile, presignData.uploadUrl, presignData.headers, {
        onProgress: (percent) => {
          options?.onProgress?.({ phase: "uploading", percent });
        },
        signal: options?.signal,
      });

      const completeResponse = await $uploadRepository.completeDescriptionVideo({
        objectKey: presignData.objectKey,
        fileName: sourceFile.name,
        contentType: sourceContentType,
        size: sourceFile.size,
      });

      options?.onProgress?.({ phase: "uploading", percent: 100 });

      return completeResponse.data;
    } catch (uploadError) {
      error.value = getVideoUploadErrorMessage(uploadError);
      throw uploadError;
    } finally {
      isUploadingVideo.value = false;
    }
  };

  return {
    error,
    isUploadingVideo,
    uploadDescriptionVideo,
  };
}
