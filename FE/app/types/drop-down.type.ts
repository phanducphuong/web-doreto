export type TDropdownMenuItem = {
  label: string;
  value: string | number;
  icon?: Component;
  disabled?: boolean;
  destructive?: boolean; // show danger item
};

export type TDropdownMenuGroup = {
  label?: string;
  items: TDropdownMenuItem[];
};
