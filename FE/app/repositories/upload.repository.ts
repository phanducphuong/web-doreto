import {
  MEDIA_COMPRESSION_PRESETS,
  type TMediaCompressionPreset,
} from "~/constants/media-compression.constant";
import type { TUploadFileResponse } from "~/types/file.type";
import type {
  TVideoCompleteApiResponse,
  TVideoCompleteRequest,
  TVideoPresignApiResponse,
  TVideoPresignRequest,
} from "~/types/video-upload.type";

export type TUploadFilesRequestOptions = {
  preset?: TMediaCompressionPreset;
};

const createUploadRepository = ($api: typeof $fetch) => ({
  uploadFiles: async (files: File[], options?: TUploadFilesRequestOptions) => {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    if (options?.preset) {
      const compression = MEDIA_COMPRESSION_PRESETS[options.preset];
      formData.append("maxWidth", String(compression.maxWidth));
      formData.append("maxBytes", String(compression.maxBytes));
    }

    return $api<TUploadFileResponse>("/uploads/files", {
      method: "POST",
      body: formData,
    });
  },

  presignDescriptionVideo: (body: TVideoPresignRequest) =>
    $api<TVideoPresignApiResponse>("/uploads/videos/presign", {
      method: "POST",
      body,
    }),

  completeDescriptionVideo: (body: TVideoCompleteRequest) =>
    $api<TVideoCompleteApiResponse>("/uploads/videos/complete", {
      method: "POST",
      body,
    }),
});

export default createUploadRepository;
