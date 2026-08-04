import { generateSlug } from "~/utils/data.utils";
import {
  ECategoryOrderLimit,
  type TCategoryFormError,
  type TExistedCategory,
} from "~/types/category.type";
import messageService from "~/services/message.service";

export default function useCategory() {
  const toast = useToast();
  const { $categoryRepository } = useNuxtApp();
  const loadingStates = ref({
    upsert: false,
    delete: false,
  });

  const validateCategoryForm = (data: Partial<TExistedCategory>): TCategoryFormError => {
    const errors: TCategoryFormError = {};

    if (!data.name || data.name.trim() === "") {
      errors.name = "Tên danh mục là bắt buộc";
    }

    if (data.description && data.description.length > 255) {
      errors.description = "Mô tả không được vượt quá 255 ký tự";
    }

    if (!data.slug || data.slug.trim() === "") {
      errors.slug = "Slug là bắt buộc";
    }

    if (
      isNumber(data.order) &&
      ((data.order as number) < ECategoryOrderLimit.MIN ||
        (data.order as number) > ECategoryOrderLimit.MAX)
    ) {
      errors.order = `Thứ tự hiển thị phải nằm trong khoảng từ ${ECategoryOrderLimit.MIN} đến ${ECategoryOrderLimit.MAX}`;
    }

    return errors;
  };

  const deleteCategory = async (categoryId: string): Promise<boolean> => {
    try {
      loadingStates.value.delete = true;
      const isConfirm = await messageService.confirm({
        title: "Xóa danh mục",
        content: "Bạn có chắc chắn muốn xóa danh mục này không?",
        confirmText: "Xóa",
        cancelText: "Hủy",
      });

      if (!isConfirm) return false;
      await $categoryRepository.deleteOne(categoryId);
      toast.success({ message: "Xóa danh mục thành công" });
      return true;
    } catch (error) {
      console.error(error);
      toast.error({ message: "Xóa danh mục thất bại" });
      return false;
    } finally {
      loadingStates.value.delete = false;
    }
  };

  const upsertCategory = async (payload: Partial<TExistedCategory>) => {
    try {
      loadingStates.value.upsert = true;
      const data = prepareCatePayload(payload);

      const method = data._id ? $categoryRepository.updateOne : $categoryRepository.createOne;
      const response = await method(data);
      toast.success({ message: `Lưu danh mục thành công` });
      return response;
    } catch (error) {
      console.error(error);
      toast.error({ message: "Lưu danh mục thất bại" });
    } finally {
      loadingStates.value.upsert = false;
    }
  };

  const prepareCatePayload = (data: Partial<TExistedCategory>) => {
    return {
      name: data.name,
      slug: data.slug || generateSlug(data.name),
      // parentId: data.parentId,
      // icon: data.icon,
      order: data.order,
      ...(data._id && { _id: data._id }),
    };
  };

  return {
    loadingStates,
    prepareCatePayload,
    deleteCategory,
    upsertCategory,
    validateCategoryForm,
  };
}
