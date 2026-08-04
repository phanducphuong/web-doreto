import type { TExistedEntity } from "./base.type";

export type TCategoryFormError = {
  name?: string;
  slug?: string;
  description?: string;
  order?: string;
};

export type TCategory = {
  name: string;
  description?: string;
  slug: string;
  // parentId?: number;
  // parent?: TCategory | TExistedCategory;
  // icon?: string;
  // iconUpload?: File[];
  order?: number;
};

export type TExistedCategory = TCategory & TExistedEntity;

export enum ECategoryOrderLimit {
  MIN = 0,
  MAX = 5,
}
