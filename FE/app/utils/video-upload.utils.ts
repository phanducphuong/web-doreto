import type { TVideoUploadErrorCode } from "~/types/video-upload.type";
import { VIDEO_UPLOAD_ERROR_MESSAGES } from "~/constants/video-upload.constant";

export const resolveVideoContentType = (file: File): "video/mp4" | "video/quicktime" | null => {
  const mime = file.type.toLowerCase();
  if (mime === "video/mp4") return "video/mp4";
  if (mime === "video/quicktime") return "video/quicktime";

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "mp4") return "video/mp4";
  if (extension === "mov") return "video/quicktime";

  return null;
};

export const getVideoUploadErrorMessage = (error: unknown, fallback = "Upload video thất bại."): string => {
  if (typeof error !== "object" || error === null) return fallback;

  const err = error as Record<string, unknown>;
  const data = err.data as Record<string, unknown> | undefined;
  const code = (data?.code ?? err.code) as TVideoUploadErrorCode | undefined;

  if (code && VIDEO_UPLOAD_ERROR_MESSAGES[code]) {
    return VIDEO_UPLOAD_ERROR_MESSAGES[code];
  }

  if (data && typeof data.message === "string" && data.message.trim()) {
    return data.message.trim();
  }

  if (typeof err.message === "string" && err.message.trim()) {
    return err.message.trim();
  }

  return fallback;
};

export const putFileToPresignedUrl = (
  file: File | Blob,
  uploadUrl: string,
  headers: Record<string, string>,
  options?: {
    onProgress?: (percent: number) => void;
    signal?: AbortSignal;
  },
): Promise<void> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);

    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    const onAbort = () => {
      xhr.abort();
      reject(new DOMException("Upload cancelled", "AbortError"));
    };

    if (options?.signal) {
      if (options.signal.aborted) {
        onAbort();
        return;
      }
      options.signal.addEventListener("abort", onAbort, { once: true });
    }

    xhr.upload.onprogress = (event) => {
      if (!options?.onProgress || !event.lengthComputable) return;
      options.onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    };

    xhr.onload = () => {
      options?.signal?.removeEventListener("abort", onAbort);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error(`Upload video thất bại (${xhr.status}).`));
    };

    xhr.onerror = () => {
      options?.signal?.removeEventListener("abort", onAbort);
      reject(new Error("Upload video thất bại."));
    };

    xhr.send(file);
  });
