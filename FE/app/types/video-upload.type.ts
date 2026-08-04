export type TVideoContentType = "video/mp4" | "video/quicktime";

export type TVideoPresignRequest = {
  fileName: string;
  contentType: TVideoContentType;
  size: number;
};

export type TVideoPresignResponse = {
  uploadUrl: string;
  publicUrl: string;
  objectKey: string;
  expiresAt: string;
  headers: { "Content-Type": TVideoContentType };
};

export type TVideoCompleteRequest = {
  objectKey: string;
  fileName: string;
  contentType: TVideoContentType;
  size: number;
};

export type TVideoCompleteResponse = {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  objectKey: string;
};

export type TVideoPresignApiResponse = {
  success: boolean;
  data: TVideoPresignResponse;
};

export type TVideoCompleteApiResponse = {
  success: boolean;
  data: TVideoCompleteResponse;
};

export type TVideoUploadErrorCode =
  | "VIDEO_UPLOAD_INVALID_TYPE"
  | "VIDEO_UPLOAD_FILE_TOO_LARGE"
  | "VIDEO_UPLOAD_INVALID_OBJECT_KEY"
  | "VIDEO_UPLOAD_COMPLETE_MISMATCH"
  | "VIDEO_UPLOAD_OBJECT_NOT_FOUND"
  | "VIDEO_UPLOAD_PRESIGN_FAILED";
