import type { TUploadFilesOptions } from "~/composables/useUploadFiles";

export default function useUpload() {
  const toast = useToast();
  const { uploadFiles: uploadFilesWithCompression } = useUploadFiles();

  const uploadFiles = async (
    files: File[],
    options?: TUploadFilesOptions,
  ): Promise<string[] | null> => {
    try {
      const urls = await uploadFilesWithCompression(files, options);
      toast.success({ message: "Tải lên file thành công" });
      return urls;
    } catch (error) {
      console.error(error);
      toast.error({ message: "Tải lên file thất bại" });
      return null;
    }
  };

  return {
    uploadFiles,
  };
}
