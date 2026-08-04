export type TTableColumn<T> = {
  title: string;
  key: keyof T | (string & {});
  // for quick rendering
  render?: (value: T[keyof T], record: T) => string | number;
  // for slot rendering
  slotKey?: string;
  colClass?: string;
  center?: boolean;
};

export type TTablePagination = {
  page: number;
  totalPage: number;
  total: number;
  count: number;
};
