export type TExistedEntity = {
  _id: number | string;
  createdAt: string;
  updatedAt: string | null;
};

export type TPosition = "bottom-start" | "bottom-end" | "top-start" | "top-end";

export type TRouteOption = {
  name: string;
  params: Record<string, string | number>;
};

export type TBreadcrumb = {
  label: string;
  to?: string | TRouteOption;
  disabled?: boolean;
};
