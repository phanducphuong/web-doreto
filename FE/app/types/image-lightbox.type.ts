import type { TActiveImageFrame } from "./image-frame.type";

export type TImageLightboxSlide =
  | { kind: "image"; src: string }
  | { kind: "framed"; src: string; frame: TActiveImageFrame };

export type TImageLightboxPayload = {
  images?: string[];
  slides?: TImageLightboxSlide[];
  index?: number;
};
