import type { TUploadFileResponse } from "~/types/file.type";
import type {
  TVideoCompleteApiResponse,
  TVideoCompleteRequest,
  TVideoPresignApiResponse,
  TVideoPresignRequest,
} from "~/types/video-upload.type";

// Việc nén ảnh diễn ra ở client (media-compression.utils) TRƯỚC khi gọi hàm này —
// BE không nhận tham số preset nào.
const createUploadRepository = ($api: typeof $fetch) => ({
  uploadFiles: async (files: File[]) => {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

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
