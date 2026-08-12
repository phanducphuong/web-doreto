import type { TExistedEntity } from "./base.type";
import type { TExistedCategory } from "./category.type";
import type { TPaginateRequest } from "./fetch.type";
import type { TActiveImageFrame } from "./image-frame.type";
import type { TExistedTag } from "./tag.type";

export type TOptionValue = {
  _id?: string;
  code?: string;
  imageUrl?: string;
  imageFile: File[];
  price: number;
  originalPrice?: number;
  purchaseCount?: number;
  productOptionNames: string[];
  stock?: number;
};

// Một bậc combo theo tổng số lượng sản phẩm (mua N cái với giá gói).
// Tầng giá phủ lên biến thể màu/size — không phải biến thể.
export type TComboTier = {
  quantity: number; // số lượng sản phẩm trong combo (1 = mua lẻ)
  price: number; // giá tổng của cả gói
  originalPrice?: number; // giá gạch (tùy chọn)
  freeship?: boolean; // freeship cho bậc này
  label?: string; // nhãn hiển thị (bỏ trống -> "N sản phẩm")
};

export type TProduct = {
  _id: string;
  name: string;
  // Slug SEO cho URL /san-pham/:slug (do BE sinh, cố định sau khi đặt)
  slug?: string;
  description?: string;
  descriptionFrameId?: string | null;
  descriptionFrame?: TActiveImageFrame | null;
  price?: number;
  imageUrls: string[];
  imageFiles: File[];
  thumbnailUrls: string[];
  thumbnailFiles: File[];
  categoryIds: string[];
  tagIds: string[];
  similarProductIds?: string[];
  productOptions: string[];
  // Bậc combo theo tổng số lượng (mua N cái với giá gói), lưu riêng theo SP
  comboTiers?: TComboTier[];
  optionValueIds: string[];
  optionValues: TOptionValue[];
  normalizedName: string;
  minPrice: number;
  maxPrice: number;
  purchaseCount: string | number;
  virtualPurchaseCount?: number;
  averageRating?: number;
  ratingCount?: number;
  isActive: boolean;
  categories?: TExistedCategory[];
  tags?: TExistedTag[];
  stock?: number;
};

export type TExistedProduct = TProduct & TExistedEntity;

export type TProductPriceData = {
  minPrice: number;
  maxPrice: number;
  maxDiscountPercent: number;
  optionDiscountPercents: number[];
  originalPrice?: number;
};

export type TProductQueryParams = TPaginateRequest & {
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: string;
  sortBy?: "price" | "updatedAt" | "purchaseCount";
  sortOrder?: "asc" | "desc";
};

export type TProductFormError = {
  name?: string;
  slug?: string;
  description?: string;
  categoryIds?: string;
  imageUrls?: string;
  thumbnailUrls?: string;
  productOptions?: string;
  optionValues?: {
    imageUrl?: string;
    code?: string;
    price?: string;
    originalPrice?: string;
    productOptionNames?: string[];
  }[];
};

export type TProductSuggestedQueryParams = {
  productIds: string[];
  limit: number;
  keywords: string[];
};
