import type { TExistedEntity } from "./base.type";

export type TTag = {
  name: string;
  icon?: string | null;
  order?: number;
  isActive: boolean;
};

export type TExistedTag = TTag & TExistedEntity;

export type TCreateTagPayload = {
  name: string;
  icon?: string;
  order?: number;
};

export type TUpdateTagPayload = Partial<TCreateTagPayload>;

export type TTagFormError = {
  name?: string;
  icon?: string;
  order?: string;
};
