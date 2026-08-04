export type TImageFrame = {
  name: string;
  imageUrl: string;
  insetTop?: number;
  insetRight?: number;
  insetBottom?: number;
  insetLeft?: number;
  sortOrder?: number;
  isActive: boolean;
};

export type TExistedImageFrame = TImageFrame & {
  _id: number;
  createdAt: string;
  updatedAt: string | null;
};

export type TActiveImageFrame = Pick<
  TExistedImageFrame,
  | "_id"
  | "name"
  | "imageUrl"
  | "insetTop"
  | "insetRight"
  | "insetBottom"
  | "insetLeft"
  | "sortOrder"
>;

export type TCreateImageFramePayload = {
  name: string;
  imageUrl: string;
  insetTop?: number;
  insetRight?: number;
  insetBottom?: number;
  insetLeft?: number;
  sortOrder?: number;
  isActive?: boolean;
};

export type TUpdateImageFramePayload = Partial<TCreateImageFramePayload>;

export type TFilterImageFrameQuery = {
  page?: number;
  limit?: number;
  isActive?: boolean;
};

export type TImageFrameFormError = {
  name?: string;
  imageUrl?: string;
  insetTop?: string;
  insetRight?: string;
  insetBottom?: string;
  insetLeft?: string;
  sortOrder?: string;
};
