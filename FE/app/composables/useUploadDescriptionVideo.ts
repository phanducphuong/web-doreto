import type { TVideoCompleteResponse } from "~/types/video-upload.type";
import { VIDEO_UPLOAD_MAX_BYTES } from "~/constants/video-upload.constant";
import { compressVideoFile } from "~/utils/video-compression.utils";
import {
  getVideoUploadErrorMessage,
  putFileToPresignedUrl,
  resolveVideoContentType,
} from "~/utils/video-upload.utils";

export type TDescriptionVideoUploadPhase = "idle" | "compressing" | "uploading";

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
    if (!resolveVideoContentType(sourceFile)) {
      throw new Error("Định dạng video không được hỗ trợ.");
    }

    try {
      isUploadingVideo.value = true;
      error.value = "";

      // Video > 50MB: nén trên trình duyệt trước; ≤ 50MB giữ nguyên.
      if (sourceFile.size > VIDEO_UPLOAD_MAX_BYTES) {
        options?.onProgress?.({ phase: "compressing", percent: 0 });
      }
      const uploadFile = await compressVideoFile(sourceFile, {
        signal: options?.signal,
        onProgress: (percent) => {
          options?.onProgress?.({ phase: "compressing", percent });
        },
      });

      const contentType = resolveVideoContentType(uploadFile);
      if (!contentType) {
        throw new Error("Định dạng video không được hỗ trợ.");
      }

      options?.onProgress?.({ phase: "uploading", percent: 0 });

      const presignResponse = await $uploadRepository.presignDescriptionVideo({
        fileName: uploadFile.name,
        contentType,
        size: uploadFile.size,
      });

      const presignData = presignResponse.data;

      await putFileToPresignedUrl(uploadFile, presignData.uploadUrl, presignData.headers, {
        onProgress: (percent) => {
          options?.onProgress?.({ phase: "uploading", percent });
        },
        signal: options?.signal,
      });

      const completeResponse = await $uploadRepository.completeDescriptionVideo({
        objectKey: presignData.objectKey,
        fileName: uploadFile.name,
        contentType,
        size: uploadFile.size,
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
