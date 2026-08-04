export type TSigninDto = {
  /** SĐT (backend nhận cả email lẫn SĐT qua trường username) */
  username: string;
  password: string;
};

export type TSignupDto = {
  name: string;
  phone: string;
  password: string;
  email?: string;
};
