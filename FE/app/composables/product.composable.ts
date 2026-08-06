import type { TExistedProduct, TProductFormError, TProductQueryParams } from "~/types/product.type";
import type { TTablePagination } from "~/types/table.type";

export default function useProduct() {
  const toast = useToast();
  const { $productRepository, $event } = useNuxtApp();
  const loadingStates = ref({
    upsert: false,
    delete: false,
  });

  const isFetching = ref(false);
  const listProducts = ref<any[]>([]);

  const pagination = ref<TTablePagination>({
    page: 1,
    totalPage: 0,
    total: 0,
    count: 0,
  });

  const fetchProducts = async (params: TProductQueryParams) => {
    try {
      isFetching.value = true;

      const res = await $productRepository.getMany(params);
      listProducts.value = res.data;
      const limit = params.limit || 10; // default limit
      pagination.value = {
        page: res.page,
        totalPage: Math.ceil(res.total / limit),
        total: res.total,
        count: res.count,
      };
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      isFetching.value = false;
    }
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    try {
      loadingStates.value.delete = true;
      // TODO: Comment tạm thời để test, sẽ mở lại sau khi hoàn thành phần message service
      // const isConfirm = await messageService.confirm({
      //   title: "Xóa sản phẩm",
      //   content: "Bạn có chắc chắn muốn xóa sản phẩm này không?",
      //   confirmText: "Xóa",
      //   cancelText: "Hủy",
      // });

      // if (!isConfirm) return false;
      await $productRepository.deleteOne(productId);
      toast.success({ message: "Xóa sản phẩm thành công" });
      return true;
    } catch (error) {
      console.error(error);
      toast.error({ message: "Xóa sản phẩm thất bại" });
      return false;
    } finally {
      loadingStates.value.delete = false;
    }
  };

  const upsertProduct = async (payload: Partial<TExistedProduct>) => {
    try {
      loadingStates.value.upsert = true;
      const method = payload._id ? $productRepository.updateOne : $productRepository.createOne;
      const response = await method(payload);
      toast.success({ message: `Lưu sản phẩm thành công` });
      return response;
    } catch (error) {
      console.error(error);
      toast.error({ message: "Lưu sản phẩm thất bại" });
    } finally {
      loadingStates.value.upsert = false;
    }
  };

  const validateProductForm = (data: Partial<TExistedProduct>): TProductFormError => {
    const errors: TProductFormError = {};

    const isEmpty = (arr?: any[]) => !arr || arr.length === 0;

    // ✅ Tên sản phẩm
    if (!data.name || data.name.trim() === "") {
      errors.name = "Tên sản phẩm là bắt buộc";
    }

    // ✅ Mô tả (optional)
    // if (data.description && data.description.length > 500) {
    //   errors.description = "Mô tả không được vượt quá 500 ký tự";
    // }

    // ✅ Danh mục
    if (isEmpty(data.categoryIds)) {
      errors.categoryIds = "Danh mục là bắt buộc";
    }

    // ✅ Image (check cả URL và FILE)
    if (isEmpty(data.imageUrls) && isEmpty(data.imageFiles)) {
      errors.imageUrls = "Hình ảnh là bắt buộc";
    }

    // ✅ Thumbnail
    if (isEmpty(data.thumbnailUrls) && isEmpty(data.thumbnailFiles)) {
      errors.thumbnailUrls = "Thumbnail là bắt buộc";
    }

    // ✅ Product options
    // if (isEmpty(data.productOptions)) {
    //   errors.productOptions = "Thông số là bắt buộc";
    // }

    // ✅ Option values
    if (data.optionValues?.length) {
      errors.optionValues = data.optionValues.map((value) => {
        const itemError: {
          imageUrl?: string;
          code?: string;
          price?: string;
          originalPrice?: string;
          productOptionNames?: string[];
        } = {};

        const trimmedCode = value.code?.trim();
        if (trimmedCode && trimmedCode.length > 100) {
          itemError.code = "Mã biến thể tối đa 100 ký tự";
        }

        // Ảnh biến thể là TÙY CHỌN (không bắt buộc). Sản phẩm đã có ảnh chính;
        // biến thể không có ảnh riêng sẽ dùng ảnh sản phẩm khi hiển thị.

        // ✅ Giá
        if (value.price == null) {
          itemError.price = "Giá là bắt buộc";
        } else if (Number(value.price) <= 0) {
          itemError.price = "Giá phải lớn hơn 0";
        }

        // ✅ Giá gốc
        if (value.originalPrice != null && Number(value.originalPrice) < Number(value.price)) {
          itemError.originalPrice = "Giá gốc phải >= giá";
        }

        // ✅ productOptionNames
        if (data.productOptions?.length) {
          itemError.productOptionNames = data.productOptions.map((_: any, idx: number) => {
            if (
              !value.productOptionNames ||
              !value.productOptionNames[idx] ||
              value.productOptionNames[idx].trim() === ""
            ) {
              return "Trường này là bắt buộc";
            }
            return "";
          });
        }

        return itemError;
      });
    }

    return errors;
  };

  const openQuickView = (product: TExistedProduct) => {
    $event("product:quick-view", product);
  };

  return {
    loadingStates,
    isFetching,
    listProducts,
    pagination,
    fetchProducts,
    upsertProduct,
    deleteProduct,
    validateProductForm,
    openQuickView,
  };
}
