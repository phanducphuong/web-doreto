import { Image } from "@tiptap/extension-image";
import type { Editor } from "@tiptap/vue-3";
import type { Ref } from "vue";
import type { TActiveImageFrame } from "~/types/image-frame.type";
import { buildFramedImageContent } from "~/utils/image-frame.utils";

const FRAME_PREVIEW_VERSION_ATTR = "framePreviewVersion";

export function refreshFramedImagePreviews(editor: Editor | undefined) {
  if (!editor) return;

  const { state, view } = editor;
  const tr = state.tr;
  let updated = false;
  const version = Date.now();

  state.doc.descendants((node, pos) => {
    if (node.type.name !== "image") return;
    updated = true;
    tr.setNodeMarkup(pos, undefined, {
      ...node.attrs,
      [FRAME_PREVIEW_VERSION_ATTR]: version,
    });
  });

  if (updated) {
    view.dispatch(tr);
  }
}

export function createFramedImageExtension(descriptionFrame: Ref<TActiveImageFrame | null | undefined>) {
  return Image.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        [FRAME_PREVIEW_VERSION_ATTR]: {
          default: 0,
          parseHTML: () => null,
          renderHTML: () => ({}),
        },
      };
    },
    addNodeView() {
      return ({ node }) => {
        let currentNode = node;
        const figure = document.createElement("figure");
        figure.className = "desc-framed-image desc-framed-image--editor";
        figure.setAttribute("contenteditable", "false");

        const render = () => {
          const frame = descriptionFrame.value ?? null;
          buildFramedImageContent(figure, {
            photoSrc: currentNode.attrs.src || "",
            alt: currentNode.attrs.alt || "",
            frame,
          });

          if (!frame) {
            figure.className = "desc-framed-image-editor-plain";
          } else {
            figure.className = "desc-framed-image desc-framed-image--editor";
            if (frame._id) {
              figure.setAttribute("data-frame-id", String(frame._id));
            }
          }
        };

        render();

        return {
          dom: figure,
          update: (updatedNode) => {
            if (updatedNode.type.name !== "image") return false;
            currentNode = updatedNode;
            render();
            return true;
          },
          ignoreMutation: () => true,
        };
      };
    },
  });
}
