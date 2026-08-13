import type { TImageLightboxPayload } from "./image-lightbox.type";
import type { TExistedProduct } from "./product.type";

export type TOpenSignModalEventParam = {
  type: "sign-in" | "sign-up";
};

export type TApplicationEvents = {
  "auth:open-sign-modal": TOpenSignModalEventParam;
  "product:quick-view": TExistedProduct;
  "product-filter:toggle": undefined;
  "image-lightbox:open": TImageLightboxPayload;
};

declare module "#app" {
  interface NuxtApp {
    $event: <K extends keyof TApplicationEvents>(
      event: K,
      ...payload: undefined extends TApplicationEvents[K]
        ? [TApplicationEvents[K]?]
        : [TApplicationEvents[K]]
    ) => void;

    $listen: <K extends keyof TApplicationEvents>(
      event: K,
      handler: (payload: TApplicationEvents[K]) => void,
    ) => void;

    $off: <K extends keyof TApplicationEvents>(
      event: K,
      handler: (payload: TApplicationEvents[K]) => void,
    ) => void;
  }
}

export {};
