import { h, render } from "vue";
import ConfirmModal from "~/components/molecules/common/ConfirmModal.vue";
import type { TMessageServiceOptions } from "~/types/modal.type";

const messageService = {
  confirm: (options: TMessageServiceOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      if (import.meta.server) {
        resolve(false);
        return;
      }

      const { vueApp } = useNuxtApp();
      const container = document.createElement("div");
      document.body.appendChild(container);

      const vnode = h(ConfirmModal, {
        ...options,
        onResolve: (decision: boolean) => {
          resolve(decision);
          cleanup();
        },
      });
      vnode.appContext = vueApp._context;

      const cleanup = () => {
        render(null, container);
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      };

      render(vnode, container);
    });
  },
};

export default messageService;
