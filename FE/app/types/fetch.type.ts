export type TPaginateResponse<T = any> = {
  total: number;
  page: number;
  count: number;
  data: T[];
};

export type TPaginateRequest = {
  page?: number;
  limit?: number;
};
