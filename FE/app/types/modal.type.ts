export type TAppModalProps = {
  defaultVisible?: boolean;
  header?: string;
  isFullScreen?: boolean;
  isShowClose?: boolean;
  closeOnClickOverlay?: boolean;
  width?: number;
};

export type TMessageServiceOptions = {
  title?: string;
  content: string;
  confirmText?: string;
  cancelText?: string;
};
