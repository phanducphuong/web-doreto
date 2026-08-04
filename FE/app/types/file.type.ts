export type TUploadFileItem = {
  url: string;
  filename: string;
  originalName: string;
  size: number;
};

export type TUploadFileResponse = {
  success: boolean;
  data: TUploadFileItem[];
};
