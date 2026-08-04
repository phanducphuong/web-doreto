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

export type TProduct = {
  _id: number;
  name: string;
  description?: string;
  descriptionFrameId?: number | null;
  descriptionFrame?: TActiveImageFrame | null;
  price?: number;
  imageUrls: string[];
  imageFiles: File[];
  thumbnailUrls: string[];
  thumbnailFiles: File[];
  categoryIds: number[];
  tagIds: number[];
  productOptions: string[];
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
  categoryId?: number;
  sortBy?: "price" | "updatedAt" | "purchaseCount";
  sortOrder?: "asc" | "desc";
};

export type TProductFormError = {
  name?: string;
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
  productIds: number[];
  limit: number;
  keywords: string[];
};
