export interface IPaginatedResponse<T> {
  page: number;
  count: number;
  total: number;
  data: T[];
}
