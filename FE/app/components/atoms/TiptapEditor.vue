<template>
  <ClientOnly>
    <div
      :class="[
        'w-full rounded-md border bg-white transition-colors tiptap-wrapper',
        {
          'border-danger focus-within:ring-1 focus-within:ring-danger': props.error,
          'border-third-light focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary':
            !props.error,
          'bg-gray-100 cursor-not-allowed opacity-60': props.disabled,
        },
      ]"
    >
      <div v-if="editor && !props.disabled" class="tiptap-sticky-tools">
        <div :class="['tiptap-toolbar', { locked: isEditorLocked }]">
          <AtomsTooltip content="Bold">
            <button
              type="button"
              :class="['toolbar-btn', { active: editor.isActive('bold') }]"
              @click="editor.chain().focus().toggleBold().run()"
            >
              <Bold class="size-4" />
            </button>
          </AtomsTooltip>
          <AtomsTooltip content="Italic">
            <button
              type="button"
              :class="['toolbar-btn', { active: editor.isActive('italic') }]"
              @click="editor.chain().focus().toggleItalic().run()"
            >
              <Italic class="size-4" />
            </button>
          </AtomsTooltip>
          <AtomsTooltip content="Strikethrough">
            <button
              type="button"
              :class="['toolbar-btn', { active: editor.isActive('strike') }]"
              @click="editor.chain().focus().toggleStrike().run()"
            >
              <Strikethrough class="size-4" />
            </button>
          </AtomsTooltip>

          <span class="toolbar-divider" />

          <AtomsTooltip content="Heading 2">
            <button
              type="button"
              :class="['toolbar-btn', { active: editor.isActive('heading', { level: 2 }) }]"
              @click="editor.chain().focus().toggleNode('heading', { level: 2 }).run()"
            >
              <Heading2 class="size-4" />
            </button>
          </AtomsTooltip>
          <AtomsTooltip content="Heading 3">
            <button
              type="button"
              :class="['toolbar-btn', { active: editor.isActive('heading', { level: 3 }) }]"
              @click="editor.chain().focus().toggleNode('heading', { level: 3 }).run()"
            >
              <Heading3 class="size-4" />
            </button>
          </AtomsTooltip>
          <span class="toolbar-divider" />

          <AtomsTooltip content="Bullet list">
            <button
              type="button"
              :class="['toolbar-btn', { active: editor.isActive('bulletList') }]"
              @click="editor.chain().focus().toggleBulletList().run()"
            >
              <List class="size-4" />
            </button>
          </AtomsTooltip>
          <AtomsTooltip content="Ordered list">
            <button
              type="button"
              :class="['toolbar-btn', { active: editor.isActive('orderedList') }]"
              @click="editor.chain().focus().toggleOrderedList().run()"
            >
              <ListOrdered class="size-4" />
            </button>
          </AtomsTooltip>
          <AtomsTooltip content="Blockquote">
            <button
              type="button"
              :class="['toolbar-btn', { active: editor.isActive('blockquote') }]"
              @click="editor.chain().focus().toggleBlockquote().run()"
            >
              <Quote class="size-4" />
            </button>
          </AtomsTooltip>
          <AtomsTooltip content="Align left">
            <button
              type="button"
              :class="['toolbar-btn', { active: isTextAlignActive('left') }]"
              @click="setTextAlign('left')"
            >
              <AlignLeft class="size-4" />
            </button>
          </AtomsTooltip>
          <AtomsTooltip content="Align center">
            <button
              type="button"
              :class="['toolbar-btn', { active: isTextAlignActive('center') }]"
              @click="setTextAlign('center')"
            >
              <AlignCenter class="size-4" />
            </button>
          </AtomsTooltip>
          <AtomsTooltip content="Align right">
            <button
              type="button"
              :class="['toolbar-btn', { active: isTextAlignActive('right') }]"
              @click="setTextAlign('right')"
            >
              <AlignRight class="size-4" />
            </button>
          </AtomsTooltip>
          <span class="toolbar-divider" />

          <AtomsTooltip content="Horizontal rule">
            <button
              type="button"
              class="toolbar-btn"
              @click="editor.chain().focus().toggleNode('horizontalRule').run()"
            >
              <Minus class="size-4" />
            </button>
          </AtomsTooltip>
          <AtomsTooltip content="Insert image">
            <button
              type="button"
              class="toolbar-btn"
              :disabled="isUploadingImage || isUploadingVideo"
              @click="openImagePicker"
            >
              <Loader2 v-if="isUploadingImage" class="size-4 animate-spin" />
              <ImagePlus v-else class="size-4" />
            </button>
          </AtomsTooltip>
          <AtomsTooltip content="Insert video">
            <button
              type="button"
              class="toolbar-btn"
              :disabled="isUploadingImage || isUploadingVideo"
              @click="openVideoPicker"
            >
              <Loader2 v-if="isUploadingVideo" class="size-4 animate-spin" />
              <Video v-else class="size-4" />
            </button>
          </AtomsTooltip>
          <MoleculesCommonPopover placement="bottom-start">
            <AtomsTooltip content="Thêm block layout">
              <button type="button" class="toolbar-btn" :disabled="isEditorLocked">
                <LayoutTemplate class="size-4" />
              </button>
            </AtomsTooltip>
            <template #content>
              <div class="toolbar-popover-grid toolbar-popover-grid-blocks">
                <button
                  type="button"
                  class="toolbar-font-option"
                  :disabled="isEditorLocked"
                  @click="insertDescBlock"
                >
                  Block toàn bộ chiều ngang
                </button>
                <button
                  type="button"
                  class="toolbar-font-option"
                  :disabled="isEditorLocked"
                  @click="insertDescBlockRow"
                >
                  Hàng 2 cột (1/2 + 1/2)
                </button>
              </div>
            </template>
          </MoleculesCommonPopover>
          <input
            ref="imageInputRef"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onImageSelected"
          />
          <input
            ref="videoInputRef"
            type="file"
            accept="video/mp4,video/quicktime,.mp4,.mov"
            class="hidden"
            @change="onVideoSelected"
          />
          <AtomsTooltip content="Text color">
            <label
              class="toolbar-btn toolbar-btn-preview toolbar-color-picker"
              :class="{ 'is-disabled': isEditorLocked }"
            >
              <Palette class="size-4" />
              <span
                class="color-dot"
                :class="{ 'color-dot-default': !hasTextColor }"
                :style="hasTextColor ? { backgroundColor: pickerColor } : undefined"
              />
              <input
                type="color"
                class="toolbar-color-input"
                :value="pickerColor"
                :disabled="isEditorLocked"
                @input="onColorPickerInput"
              />
            </label>
          </AtomsTooltip>
          <MoleculesCommonPopover placement="bottom-start">
            <button
              type="button"
              class="toolbar-btn toolbar-btn-preview"
              :disabled="isEditorLocked"
            >
              <CaseSensitive class="size-4" />
              <span class="font-family-preview">{{ currentFontFamilyLabel }}</span>
            </button>
            <template #content>
              <div class="toolbar-popover-grid toolbar-popover-grid-font">
                <button
                  v-for="item in fontFamilyOptions"
                  :key="item.value || 'default'"
                  type="button"
                  class="toolbar-font-option"
                  :class="{ active: currentFontFamily === item.value }"
                  :disabled="isEditorLocked"
                  :style="item.value ? { fontFamily: item.value } : undefined"
                  @click="setFontFamily(item.value)"
                >
                  {{ item.label }}
                </button>
              </div>
            </template>
          </MoleculesCommonPopover>
          <MoleculesCommonPopover placement="bottom-start">
            <button
              type="button"
              class="toolbar-btn toolbar-btn-preview"
              :disabled="isEditorLocked"
            >
              <Type class="size-4" />
              <span class="font-size-preview">{{ currentFontSize || "Default" }}</span>
            </button>
            <template #content>
              <div class="toolbar-popover-grid">
                <button
                  type="button"
                  class="toolbar-font-option"
                  :class="{ active: !currentFontSize }"
                  :disabled="isEditorLocked"
                  @click="setFontSize('')"
                >
                  Default
                </button>
                <button
                  v-for="size in fontSizeOptions"
                  :key="size"
                  type="button"
                  class="toolbar-font-option"
                  :class="{ active: currentFontSize === size }"
                  :disabled="isEditorLocked"
                  @click="setFontSize(size)"
                >
                  {{ size }}
                </button>
              </div>
            </template>
          </MoleculesCommonPopover>
          <button
            v-if="props.allowAiGenerate"
            type="button"
            class="toolbar-btn toolbar-ai-btn"
            :disabled="isEditorLocked"
            @click="openAiPromptModal"
          >
            <Loader2 v-if="isGeneratingAi" class="size-4 animate-spin" />
            <Sparkles v-else class="size-4" />
            <span>{{ isGeneratingAi ? "Generating..." : "Generate AI" }}</span>
          </button>
          <AtomsTooltip content="Undo">
            <button
              type="button"
              class="toolbar-btn"
              :disabled="!editor.can().undo()"
              @click="editor.chain().focus().undo().run()"
            >
              <Undo class="size-4" />
            </button>
          </AtomsTooltip>
          <AtomsTooltip content="Redo">
            <button
              type="button"
              class="toolbar-btn"
              :disabled="!editor.can().redo()"
              @click="editor.chain().focus().redo().run()"
            >
              <Redo class="size-4" />
            </button>
          </AtomsTooltip>
        </div>

        <div v-if="selectedImage && !isEditorLocked" class="desc-image-props-bar">
          <span class="desc-image-props-label">Ảnh</span>

          <button
            type="button"
            class="desc-image-action-btn"
            :disabled="isUploadingImage"
            @click="openImageReplacePicker"
          >
            <RefreshCw class="size-3.5" />
            Thay ảnh
          </button>

          <div class="desc-image-align-group">
            <button
              type="button"
              class="desc-image-icon-btn"
              :class="{ active: isImageAlignActive('left') }"
              @click="setImageAlign('left')"
            >
              <AlignLeft class="size-3.5" />
            </button>
            <button
              type="button"
              class="desc-image-icon-btn"
              :class="{ active: isImageAlignActive('center') }"
              @click="setImageAlign('center')"
            >
              <AlignCenter class="size-3.5" />
            </button>
            <button
              type="button"
              class="desc-image-icon-btn"
              :class="{ active: isImageAlignActive('right') }"
              @click="setImageAlign('right')"
            >
              <AlignRight class="size-3.5" />
            </button>
          </div>

          <label class="desc-image-props-field">
            <span>Chiều rộng</span>
            <span class="desc-block-number-control">
              <input
                :key="`image-width-${selectedImage.pos}`"
                type="number"
                class="desc-block-number-input"
                min="10"
                max="100"
                step="1"
                :value="selectedImageWidthPercent"
                @input="onImageWidthInput"
                @change="onImageWidthInput"
              />
              <span class="desc-block-unit">%</span>
            </span>
          </label>

          <label class="desc-image-props-field">
            <span>Bo góc</span>
            <span class="desc-block-number-control">
              <input
                :key="`image-radius-${selectedImage.pos}`"
                type="number"
                class="desc-block-number-input"
                min="0"
                step="1"
                :value="selectedImageRadiusPx"
                @input="onImageRadiusInput"
                @change="onImageRadiusInput"
              />
              <span class="desc-block-unit">px</span>
            </span>
          </label>

          <label class="desc-image-props-field">
            <span>Bóng</span>
            <select
              class="desc-image-shadow-select"
              :value="selectedImage.attrs.imageShadow || 'none'"
              @change="onImageShadowChange"
            >
              <option v-for="item in imageShadowOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </option>
            </select>
          </label>

          <button type="button" class="desc-block-delete-btn" @click="deleteSelectedImage">
            <Trash2 class="size-3.5" />
            Xóa ảnh
          </button>
        </div>

        <div
          v-if="selectedDescBlock && !selectedImage && !isEditorLocked"
          class="desc-block-props-bar"
        >
          <span class="desc-block-props-label">
            Block {{ selectedDescBlock.attrs.width === "half" ? "1/2" : "full" }}
          </span>

          <label class="desc-block-props-field">
            <span>Màu nền</span>
            <span class="desc-block-color-control">
              <input
                type="color"
                class="desc-block-color-input"
                :value="selectedDescBlock.attrs.backgroundColor || '#ffffff'"
                @input="onDescBlockBackgroundInput"
              />
              <button
                type="button"
                class="desc-block-clear-btn"
                @click="updateSelectedDescBlock({ backgroundColor: null })"
              >
                Xóa
              </button>
            </span>
          </label>

          <label class="desc-block-props-field">
            <span>Bo góc</span>
            <span class="desc-block-number-control">
              <input
                :key="`radius-${selectedDescBlock.pos}`"
                type="number"
                class="desc-block-number-input"
                min="0"
                step="1"
                :value="selectedDescBlockRadiusPx"
                @input="onDescBlockRadiusInput"
                @change="onDescBlockRadiusInput"
              />
              <span class="desc-block-unit">px</span>
            </span>
          </label>

          <label class="desc-block-props-field">
            <span>Padding</span>
            <span class="desc-block-number-control">
              <input
                :key="`padding-${selectedDescBlock.pos}`"
                type="number"
                class="desc-block-number-input"
                min="0"
                step="1"
                :value="selectedDescBlockPaddingPx"
                @input="onDescBlockPaddingInput"
                @change="onDescBlockPaddingInput"
              />
              <span class="desc-block-unit">px</span>
            </span>
          </label>

          <button type="button" class="desc-block-delete-btn" @click="deleteSelectedDescBlock">
            <Trash2 class="size-3.5" />
            Xóa block
          </button>
        </div>
      </div>
      <EditorContent :editor="editor" />
    </div>
  </ClientOnly>

  <MoleculesCommonModal
    ref="aiPromptModalRef"
    header="Generate mô tả với AI"
    :width="620"
    :is-show-close="true"
  >
    <div class="space-y-3 pt-3">
      <p class="text-sm text-third-dark">
        Nhập yêu cầu cho AI (tone, độ dài, nội dung cần nhấn mạnh...)
      </p>
      <textarea
        v-model="aiPrompt"
        class="w-full min-h-[140px] rounded-lg border border-third-light p-3 outline-none focus:border-secondary"
        placeholder="Ví dụ: Viết lại ngắn gọn, nhấn mạnh chất liệu và phong cách phù hợp phòng khách."
      />
    </div>
    <template #footer>
      <AtomsButton type="ghost" @click="aiPromptModalRef?.closeModal()">Hủy</AtomsButton>
      <AtomsButton type="primary" :is-loading="isGeneratingAi" @click="submitAiGenerate">
        Generate
      </AtomsButton>
    </template>
  </MoleculesCommonModal>

  <MoleculesImageCropModal ref="imageCropModalRef" />
  <MoleculesDescriptionVideoUploadModal ref="videoUploadModalRef" />

  <MoleculesCommonModal
    ref="aiPreviewModalRef"
    header="Preview kết quả AI"
    :width="700"
    :is-show-close="true"
  >
    <div class="space-y-3 pt-3">
      <p class="text-sm text-third-dark">Xem trước nội dung trước khi chèn vào editor.</p>
      <div
        class="rounded-lg border border-third-light p-3 max-h-[320px] overflow-auto whitespace-pre-line"
      >
        {{ aiPreview }}
      </div>
    </div>
    <template #footer>
      <AtomsButton type="ghost" @click="aiPreviewModalRef?.closeModal()">Đóng</AtomsButton>
      <AtomsButton type="primary" @click="applyAiPreview">Apply vào editor</AtomsButton>
    </template>
  </MoleculesCommonModal>
</template>

<script setup lang="ts">
import { EditorContent, Extension, useEditor } from "@tiptap/vue-3";
import { NodeSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import {
  DescImage,
  parseImageWidthPercent,
  type TDescImageAttrs,
  type TImageShadowPreset,
} from "~/utils/tiptap-desc-image.extension";
import { DescVideo } from "~/utils/tiptap-desc-video.extension";
import { resolveVideoContentType } from "~/utils/video-upload.utils";
import {
  DescBlock,
  DescBlockRow,
  createDefaultDescBlockContent,
  createHalfDescBlockContent,
  parseCssPx,
  toCssPx,
  type TDescBlockAttrs,
} from "~/utils/tiptap-desc-block.extension";
import { FontSize, TextStyle } from "@tiptap/extension-text-style";
import { FontFamily } from "@tiptap/extension-text-style/font-family";
import { Color } from "@tiptap/extension-color";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Undo,
  Redo,
  ImagePlus,
  LayoutTemplate,
  Sparkles,
  Loader2,
  Palette,
  Type,
  CaseSensitive,
  Trash2,
  RefreshCw,
  Video,
} from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    disabled?: boolean;
    error?: string;
    allowAiGenerate?: boolean;
    aiName?: string;
    aiCategoryNames?: string[];
    aiTagNames?: string[];
    aiReplaceContent?: boolean;
  }>(),
  {
    modelValue: "",
    disabled: false,
    allowAiGenerate: true,
    aiName: "",
    aiCategoryNames: () => [],
    aiTagNames: () => [],
    aiReplaceContent: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const { $api } = useNuxtApp();
const toast = useToast();
const { uploadFiles } = useUploadFiles();
const imageInputRef = ref<HTMLInputElement | null>(null);
const videoInputRef = ref<HTMLInputElement | null>(null);
const imageCropModalRef = ref<{ open: (file: File) => Promise<File | null> }>();
const videoUploadModalRef = ref<{ open: (file: File) => Promise<string | null> }>();
const imageUploadMode = ref<"insert" | "replace">("insert");
const aiPromptModalRef = ref();
const aiPreviewModalRef = ref();
const isGeneratingAi = ref(false);
const isUploadingImage = ref(false);
const isUploadingVideo = ref(false);
const hasShownBase64Warning = ref(false);
const aiPrompt = ref("");
const aiPreview = ref("");
const pendingSelection = ref<{ from: number; to: number } | null>(null);
const fontFamilyOptions = [
  { label: "Default", value: "" },
  { label: "Be Vietnam Pro", value: "Be Vietnam Pro" },
  { label: "Inter", value: "Inter" },
  { label: "Montserrat", value: "Montserrat" },
  { label: "Roboto", value: "Roboto" },
  { label: "Open Sans", value: "Open Sans" },
  { label: "Lato", value: "Lato" },
  { label: "Nunito Sans", value: "Nunito Sans" },
  { label: "Source Sans 3", value: "Source Sans 3" },
  { label: "Noto Sans", value: "Noto Sans" },
  { label: "Mulish", value: "Mulish" },
];
const fontSizeOptions = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];

const normalizeFontFamily = (value: string) =>
  value
    .replace(/^['"]|['"]$/g, "")
    .split(",")[0]
    ?.trim() ?? "";

const DEFAULT_PICKER_COLOR = "#000000";

const selectedDescBlockPos = ref<number | null>(null);
const selectedDescBlockAttrs = ref<TDescBlockAttrs | null>(null);

const selectedDescBlock = computed(() => {
  if (selectedDescBlockPos.value === null || !selectedDescBlockAttrs.value) return null;
  return {
    pos: selectedDescBlockPos.value,
    attrs: selectedDescBlockAttrs.value,
  };
});

const selectedDescBlockRadiusPx = computed(() =>
  selectedDescBlock.value ? parseCssPx(selectedDescBlock.value.attrs.borderRadius, 8) : 0,
);

const selectedDescBlockPaddingPx = computed(() =>
  selectedDescBlock.value ? parseCssPx(selectedDescBlock.value.attrs.padding, 12) : 0,
);

const selectedImagePos = ref<number | null>(null);
const selectedImageAttrs = ref<TDescImageAttrs | null>(null);

const selectedImage = computed(() => {
  if (selectedImagePos.value === null || !selectedImageAttrs.value) return null;
  return {
    pos: selectedImagePos.value,
    attrs: selectedImageAttrs.value,
  };
});

const selectedImageWidthPercent = computed(() =>
  selectedImage.value ? parseImageWidthPercent(selectedImage.value.attrs.imageWidth, 100) : 100,
);

const selectedImageRadiusPx = computed(() =>
  selectedImage.value ? parseCssPx(selectedImage.value.attrs.borderRadius, 0) : 0,
);

const imageShadowOptions: { label: string; value: TImageShadowPreset | "none" }[] = [
  { label: "Không", value: "none" },
  { label: "Nhẹ", value: "sm" },
  { label: "Vừa", value: "md" },
  { label: "Đậm", value: "lg" },
];

const syncSelectedImage = () => {
  const instance = editor.value;
  if (!instance) {
    selectedImagePos.value = null;
    selectedImageAttrs.value = null;
    return;
  }

  const { selection } = instance.state;
  if (selection instanceof NodeSelection && selection.node.type.name === "image") {
    selectedImagePos.value = selection.from;
    selectedImageAttrs.value = { ...(selection.node.attrs as TDescImageAttrs) };
    return;
  }

  if (instance.isActive("image")) {
    selectedImagePos.value = null;
    selectedImageAttrs.value = { ...(instance.getAttributes("image") as TDescImageAttrs) };
    return;
  }

  selectedImagePos.value = null;
  selectedImageAttrs.value = null;
};

const syncSelectedDescBlock = () => {
  const instance = editor.value;
  if (!instance) {
    selectedDescBlockPos.value = null;
    selectedDescBlockAttrs.value = null;
    return;
  }

  const { selection } = instance.state;
  if (selection instanceof NodeSelection && selection.node.type.name === "descBlock") {
    selectedDescBlockPos.value = selection.from;
    selectedDescBlockAttrs.value = { ...(selection.node.attrs as TDescBlockAttrs) };
    return;
  }

  const $from = selection.$from;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth);
    if (node.type.name === "descBlock") {
      selectedDescBlockPos.value = $from.before(depth);
      selectedDescBlockAttrs.value = { ...(node.attrs as TDescBlockAttrs) };
      return;
    }
  }

  selectedDescBlockPos.value = null;
  selectedDescBlockAttrs.value = null;
};

const normalizeColorToHex = (color: string): string => {
  if (!color) return DEFAULT_PICKER_COLOR;
  if (color.startsWith("#")) {
    if (color.length === 4) {
      return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
    }
    return color.slice(0, 7);
  }
  const match = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return DEFAULT_PICKER_COLOR;
  const [, r, g, b] = match;
  return `#${[r, g, b].map((value) => Number(value).toString(16).padStart(2, "0")).join("")}`;
};

const updateSelectedDescBlock = (patch: Partial<TDescBlockAttrs>) => {
  if (!editor.value || selectedDescBlockPos.value === null || !selectedDescBlockAttrs.value) return;
  const nextAttrs = { ...selectedDescBlockAttrs.value, ...patch };
  editor.value
    .chain()
    .setNodeSelection(selectedDescBlockPos.value)
    .updateAttributes("descBlock", nextAttrs)
    .run();
  selectedDescBlockAttrs.value = nextAttrs;
};

const onDescBlockBackgroundInput = (event: Event) => {
  updateSelectedDescBlock({ backgroundColor: (event.target as HTMLInputElement).value });
};

const onDescBlockRadiusInput = (event: Event) => {
  const raw = (event.target as HTMLInputElement).value;
  if (raw === "") return;
  updateSelectedDescBlock({ borderRadius: toCssPx(Number(raw)) });
};

const onDescBlockPaddingInput = (event: Event) => {
  const raw = (event.target as HTMLInputElement).value;
  if (raw === "") return;
  updateSelectedDescBlock({ padding: toCssPx(Number(raw)) });
};

const deleteSelectedDescBlock = () => {
  if (!editor.value || selectedDescBlockPos.value === null) return;
  editor.value.chain().setNodeSelection(selectedDescBlockPos.value).deleteSelection().run();
  syncSelectedDescBlock();
};

const updateSelectedImage = (patch: Partial<TDescImageAttrs>) => {
  if (!editor.value || !selectedImageAttrs.value) return;

  const chain = editor.value.chain().focus();
  if (selectedImagePos.value !== null) {
    chain.setNodeSelection(selectedImagePos.value);
  }
  chain.updateAttributes("image", patch).run();
  selectedImageAttrs.value = { ...selectedImageAttrs.value, ...patch };
};

const isImageAlignActive = (align: "left" | "center" | "right") =>
  (selectedImage.value?.attrs.imageAlign ?? "center") === align;

const setImageAlign = (align: "left" | "center" | "right") => {
  if (!editor.value || isEditorLocked.value) return;
  updateSelectedImage({ imageAlign: align });
};

const onImageWidthInput = (event: Event) => {
  const raw = (event.target as HTMLInputElement).value;
  if (raw === "") return;
  const percent = Math.min(100, Math.max(10, Number(raw)));
  updateSelectedImage({ imageWidth: `${percent}%` });
};

const onImageRadiusInput = (event: Event) => {
  const raw = (event.target as HTMLInputElement).value;
  if (raw === "") return;
  updateSelectedImage({ borderRadius: toCssPx(Number(raw)) });
};

const onImageShadowChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value as TImageShadowPreset | "none";
  updateSelectedImage({ imageShadow: value === "none" ? null : value });
};

const deleteSelectedImage = () => {
  if (!editor.value) return;
  if (selectedImagePos.value !== null) {
    editor.value.chain().setNodeSelection(selectedImagePos.value).deleteSelection().run();
  } else {
    editor.value.chain().focus().deleteSelection().run();
  }
  syncSelectedImage();
};

const TextAlign = Extension.create({
  name: "textAlign",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          textAlign: {
            default: null,
            parseHTML: (element) => element.style.textAlign || null,
            renderHTML: (attributes) => {
              if (!attributes.textAlign) return {};
              return { style: `text-align: ${attributes.textAlign}` };
            },
          },
        },
      },
    ];
  },
});

const sanitizeHtmlBeforeEmit = (html: string): string => {
  if (!import.meta.client || !html) return html;
  const container = document.createElement("div");
  container.innerHTML = html;
  const base64Images = container.querySelectorAll('img[src^="data:image"]');

  if (base64Images.length) {
    base64Images.forEach((image) => image.remove());
    if (!hasShownBase64Warning.value) {
      toast.error({
        message: "Ảnh dạng base64 không được hỗ trợ. Vui lòng dùng nút upload ảnh để chèn URL.",
      });
      hasShownBase64Warning.value = true;
    }
  }

  return container.innerHTML;
};

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      codeBlock: false,
    }),
    TextStyle as any,
    Color as any,
    FontFamily as any,
    FontSize as any,
    DescImage.configure({ allowBase64: false, inline: false }) as any,
    DescVideo as any,
    TextAlign as any,
    DescBlock as any,
    DescBlockRow as any,
  ],
  editable: !props.disabled,
  onSelectionUpdate: () => {
    syncSelectedDescBlock();
    syncSelectedImage();
  },
  onUpdate: ({ editor: editorInstance }) => {
    emit("update:modelValue", sanitizeHtmlBeforeEmit(editorInstance.getHTML()));
    syncSelectedDescBlock();
    syncSelectedImage();
  },
});

const hasTextColor = computed(() => {
  const color = editor.value?.getAttributes("textStyle")?.color;
  return typeof color === "string" && !!color;
});

const pickerColor = computed(() => {
  const color = editor.value?.getAttributes("textStyle")?.color;
  if (typeof color === "string" && color) {
    return normalizeColorToHex(color);
  }
  return DEFAULT_PICKER_COLOR;
});

const currentFontSize = computed(() => {
  const fontSize = editor.value?.getAttributes("textStyle")?.fontSize;
  return typeof fontSize === "string" ? fontSize : "";
});

const currentFontFamily = computed(() => {
  const fontFamily = editor.value?.getAttributes("textStyle")?.fontFamily;
  if (typeof fontFamily !== "string" || !fontFamily) return "";
  const normalized = normalizeFontFamily(fontFamily);
  const matched = fontFamilyOptions.find((item) => item.value === normalized);
  return matched?.value ?? normalized;
});

const currentFontFamilyLabel = computed(() => {
  if (!currentFontFamily.value) return "Default";
  return (
    fontFamilyOptions.find((item) => item.value === currentFontFamily.value)?.label ??
    currentFontFamily.value
  );
});

const isEditorLocked = computed(
  () => props.disabled || isGeneratingAi.value || isUploadingVideo.value,
);
const isTextAlignActive = (align: "left" | "center" | "right") =>
  editor.value?.isActive({ textAlign: align }) || false;
const setTextAlign = (align: "left" | "center" | "right") => {
  if (!editor.value || isEditorLocked.value) return;
  if (editor.value.isActive("image")) {
    setImageAlign(align);
    return;
  }
  const chain = editor.value.chain().focus();
  if (editor.value.isActive("heading")) {
    chain.updateAttributes("heading", { textAlign: align }).run();
    return;
  }
  chain.updateAttributes("paragraph", { textAlign: align }).run();
};

const setColor = (value: string) => {
  if (isEditorLocked.value) return;
  (editor.value?.chain().focus() as any)?.setColor(value).run();
};

const onColorPickerInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  setColor(value);
};

const setFontSize = (value: string) => {
  if (isEditorLocked.value) return;
  if (!editor.value) return;
  if (!value) {
    (editor.value.chain().focus() as any).unsetFontSize().run();
    return;
  }
  (editor.value.chain().focus() as any).setFontSize(value).run();
};

const setFontFamily = (value: string) => {
  if (isEditorLocked.value) return;
  if (!editor.value) return;
  if (!value) {
    (editor.value.chain().focus() as any).unsetFontFamily().run();
    return;
  }
  (editor.value.chain().focus() as any).setFontFamily(value).run();
};

const openImagePicker = () => {
  if (isUploadingImage.value || isUploadingVideo.value) return;
  imageUploadMode.value = "insert";
  imageInputRef.value?.click();
};

const openImageReplacePicker = () => {
  if (isUploadingImage.value || isUploadingVideo.value) return;
  imageUploadMode.value = "replace";
  imageInputRef.value?.click();
};

const onImageSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = "";

  if (!file || !editor.value || !imageCropModalRef.value) return;
  if (!file.type.startsWith("image/")) {
    toast.error({ message: "Vui lòng chọn file ảnh hợp lệ." });
    return;
  }

  const croppedFile = await imageCropModalRef.value.open(file);
  if (!croppedFile) return;

  const shouldReplaceImage = imageUploadMode.value === "replace" && editor.value.isActive("image");

  try {
    isUploadingImage.value = true;
    const [imageUrl] = await uploadFiles([croppedFile], { preset: "description" });

    if (!imageUrl) {
      throw new Error("Image upload returned empty URL");
    }

    if (shouldReplaceImage) {
      (editor.value.chain().focus() as any)
        .updateAttributes("image", { src: imageUrl, alt: croppedFile.name })
        .run();
      syncSelectedImage();
      return;
    }

    (editor.value.chain().focus() as any).setImage({ src: imageUrl, alt: croppedFile.name }).run();
  } catch {
    toast.error({ message: "Upload ảnh thất bại." });
  } finally {
    isUploadingImage.value = false;
  }
};

const openVideoPicker = () => {
  if (isUploadingVideo.value || isUploadingImage.value || isEditorLocked.value) return;
  videoInputRef.value?.click();
};

const onVideoSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = "";

  if (!file || !editor.value || !videoUploadModalRef.value) return;

  if (!resolveVideoContentType(file)) {
    toast.error({ message: "Định dạng video không được hỗ trợ. Vui lòng chọn MP4 hoặc MOV." });
    return;
  }

  try {
    isUploadingVideo.value = true;
    const videoUrl = await videoUploadModalRef.value.open(file);
    if (!videoUrl) return;

    editor.value
      .chain()
      .focus()
      .insertContent({
        type: "video",
        attrs: {
          src: videoUrl,
          videoAlign: "center",
          videoWidth: "100%",
        },
      })
      .run();
  } catch {
    toast.error({ message: "Upload video thất bại." });
  } finally {
    isUploadingVideo.value = false;
  }
};

const insertDescBlock = () => {
  if (!editor.value || isEditorLocked.value) return;
  editor.value
    .chain()
    .focus()
    .insertContent(createDefaultDescBlockContent())
    .insertContent({ type: "paragraph" })
    .run();
};

const insertDescBlockRow = () => {
  if (!editor.value || isEditorLocked.value) return;
  editor.value
    .chain()
    .focus()
    .insertContent({
      type: "descBlockRow",
      content: [
        createHalfDescBlockContent("Nội dung cột 1..."),
        createHalfDescBlockContent("Nội dung cột 2..."),
      ],
    })
    .insertContent({ type: "paragraph" })
    .run();
};

const openAiPromptModal = () => {
  if (!editor.value || isEditorLocked.value) return;
  const selection = editor.value.state.selection;
  pendingSelection.value = { from: selection.from, to: selection.to };
  aiPrompt.value = "";
  aiPromptModalRef.value?.openModal();
};

const submitAiGenerate = async () => {
  if (!editor.value || isGeneratingAi.value) return;
  const prompt = aiPrompt.value.trim();
  const rawText = prompt;

  if (!rawText) {
    toast.error({ message: "Vui lòng nhập prompt trước khi generate AI." });
    return;
  }

  try {
    isGeneratingAi.value = true;
    const response = await $api<{ description: string; model: string }>(
      "/products/generate-description",
      {
        method: "POST",
        body: {
          rawText,
          name: props.aiName || undefined,
          categoryNames: props.aiCategoryNames.length ? props.aiCategoryNames : undefined,
          tagNames: props.aiTagNames.length ? props.aiTagNames : undefined,
        },
      },
    );

    const description = response?.description?.trim();
    if (!description) {
      toast.error({ message: "AI không trả về nội dung hợp lệ." });
      return;
    }
    aiPreview.value = description;
    aiPromptModalRef.value?.closeModal();
    aiPreviewModalRef.value?.openModal();
  } catch {
    toast.error({ message: "Generate bằng AI thất bại." });
  } finally {
    isGeneratingAi.value = false;
  }
};

const applyAiPreview = () => {
  if (!editor.value || !aiPreview.value.trim()) return;
  const content = `<p>${aiPreview.value.trim()}</p>`;

  if (props.aiReplaceContent) {
    editor.value.commands.setContent(content);
  } else if (pendingSelection.value) {
    editor.value
      .chain()
      .focus()
      .setTextSelection(pendingSelection.value)
      .insertContent(content)
      .run();
  } else {
    editor.value.chain().focus().insertContent(content).run();
  }

  aiPreviewModalRef.value?.closeModal();
  aiPreview.value = "";
  pendingSelection.value = null;
  toast.success({ message: "Đã chèn nội dung AI vào editor." });
};

watch(
  () => props.modelValue,
  (val) => {
    if (editor.value && val !== editor.value.getHTML()) {
      editor.value.commands.setContent(val || "");
    }
  },
);

watch(
  () => isEditorLocked.value,
  (locked) => {
    editor.value?.setEditable(!locked);
  },
  { immediate: true },
);

watch(
  () => editor.value,
  (instance) => {
    if (!instance) return;
    nextTick(() => {
      syncSelectedDescBlock();
      syncSelectedImage();
    });
  },
);

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<style lang="scss" scoped>
.tiptap-sticky-tools {
  position: sticky;
  top: 0;
  z-index: 6;
  background: #fff;
  border-radius: 6px 6px 0 0;
}

.tiptap-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-bottom: 1px solid #b6b6b6;
  flex-wrap: wrap;
  background: #fff;

  .toolbar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 6px;
    cursor: pointer;
    color: #505050;
    background: transparent;
    transition: all 0.15s ease;

    &:hover {
      background: #f5f5f5;
      color: #333;
    }

    &.active {
      background: #8b0000;
      color: #fff;
    }

    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
  }

  &.locked {
    opacity: 0.7;
  }

  .toolbar-ai-btn {
    width: auto;
    padding: 0 10px;
    gap: 6px;
    font-size: 12px;
  }

  .toolbar-divider {
    width: 1px;
    height: 20px;
    background: #b6b6b6;
    margin: 0 4px;
  }

  .toolbar-select {
    height: 30px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 0 8px;
    background: #ffffff;
    color: #374151;
    font-size: 12px;
  }

  .toolbar-btn-preview {
    width: auto;
    padding: 0 8px;
    gap: 6px;
  }

  .color-dot {
    width: 10px;
    height: 10px;
    border-radius: 9999px;
    border: 1px solid #d1d5db;
  }

  .color-dot-default {
    background: linear-gradient(135deg, #ffffff 45%, #9ca3af 45%, #9ca3af 55%, #ffffff 55%);
  }

  .color-dot-bg.color-dot-default {
    background: linear-gradient(135deg, #ffffff 45%, #d1d5db 45%, #d1d5db 55%, #ffffff 55%);
  }

  .toolbar-color-picker {
    position: relative;
    cursor: pointer;

    &.is-disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
  }

  .toolbar-color-input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    border: 0;
    padding: 0;

    &:disabled {
      cursor: not-allowed;
    }
  }

  .font-size-preview,
  .font-family-preview {
    font-size: 11px;
    min-width: 52px;
    text-align: left;
  }

  .font-family-preview {
    max-width: 96px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.toolbar-popover-grid-font {
  min-width: 220px;
}

.toolbar-popover-grid {
  display: grid;
  gap: 6px;
  min-width: 210px;
}

.toolbar-font-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  padding: 6px 8px;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
}

.toolbar-font-option:hover {
  border-color: #c7c7c7;
  background: #fafafa;
}

.toolbar-font-option.active {
  border-color: #8b0000;
  background: #fff2f0;
  color: #8b0000;
}
.tiptap-wrapper :deep(.tiptap) {
  padding: 8px 12px;
  min-height: 120px;
  outline: none;
  /* Giãn dòng mặc định — khớp trang xem sản phẩm (Description.vue) */
  line-height: 1.5;
  /* Cỡ chữ mặc định khi chưa chọn size — không thừa hưởng text-sm (14px) từ form bao ngoài */
  font-size: 16px;
}

.tiptap-wrapper :deep(.tiptap p) {
  line-height: 1.5;
  margin: 0 0 0.75rem;
}

.tiptap-wrapper :deep(.tiptap p:last-child) {
  margin-bottom: 0;
}

.tiptap-wrapper :deep(.tiptap strong),
.tiptap-wrapper :deep(.tiptap b) {
  font-weight: 700;
}

.tiptap-wrapper :deep(.tiptap s),
.tiptap-wrapper :deep(.tiptap del),
.tiptap-wrapper :deep(.tiptap strike) {
  text-decoration: line-through;
}

.tiptap-wrapper :deep(.tiptap .desc-block-row) {
  margin: 8px 0;
}

.tiptap-wrapper :deep(.tiptap .desc-block) {
  margin: 8px 0;
  min-height: 48px;
}

.tiptap-wrapper :deep(.tiptap .desc-block-row .desc-block) {
  margin: 0;
}

.desc-block-props-bar,
.desc-image-props-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
  padding: 8px 10px;
  border-bottom: 1px solid #e5e7eb;
  background: #fafafa;
}

.desc-image-props-label,
.desc-block-props-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #8b0000;
}

.desc-block-props-field,
.desc-image-props-field {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #505050;
}

.desc-image-action-btn,
.desc-image-icon-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  padding: 4px 8px;
  font-size: 11px;
  color: #505050;
  cursor: pointer;
}

.desc-image-icon-btn {
  padding: 4px;
}

.desc-image-action-btn:hover,
.desc-image-icon-btn:hover {
  border-color: #c7c7c7;
  background: #f9fafb;
}

.desc-image-icon-btn.active {
  border-color: #8b0000;
  background: #fff2f0;
  color: #8b0000;
}

.desc-image-align-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.desc-image-shadow-select {
  height: 28px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0 8px;
  font-size: 12px;
  background: #fff;
  color: #374151;
}

.desc-block-color-control {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.desc-block-color-input {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
}

.desc-block-clear-btn,
.desc-block-delete-btn {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  padding: 4px 8px;
  font-size: 11px;
  color: #505050;
  cursor: pointer;
}

.desc-block-number-control {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.desc-block-number-input {
  width: 64px;
  height: 28px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0 8px;
  font-size: 12px;
  background: #fff;
  color: #374151;
}

.desc-block-unit {
  font-size: 11px;
  color: #6b7280;
}

.desc-block-delete-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  color: #8b0000;
}

.toolbar-popover-grid-blocks {
  min-width: 220px;
}

.tiptap-wrapper :deep(.tiptap img) {
  max-width: 100%;
  height: auto;
}

.tiptap-wrapper :deep(.tiptap .desc-image-node-view) {
  position: relative;
  display: block;
  max-width: 100%;
  /* Khoảng cách dọc mặc định với text: ~1 dòng, khớp trang xem sản phẩm */
  margin: 20px 0;
  line-height: 0;
}

.tiptap-wrapper :deep(.tiptap .desc-image-node-view[data-align="left"]) {
  margin-right: auto;
  margin-left: 0;
}

.tiptap-wrapper :deep(.tiptap .desc-image-node-view[data-align="center"]) {
  margin-left: auto;
  margin-right: auto;
}

.tiptap-wrapper :deep(.tiptap .desc-image-node-view[data-align="right"]) {
  margin-left: auto;
  margin-right: 0;
}

.tiptap-wrapper :deep(.tiptap .desc-image-node-view img) {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
}

.tiptap-wrapper :deep(.tiptap .desc-image-node-view.ProseMirror-selectednode) {
  outline: none;
}

.tiptap-wrapper :deep(.tiptap .desc-image-node-view.ProseMirror-selectednode img) {
  outline: 2px solid rgba(139, 0, 0, 0.35);
  outline-offset: 2px;
}

.tiptap-wrapper :deep(.tiptap .desc-video-node-view) {
  position: relative;
  display: block;
  max-width: 100%;
  /* Khoảng cách dọc mặc định với text: ~1 dòng, khớp trang xem sản phẩm */
  margin: 20px 0;
  line-height: 0;
}

.tiptap-wrapper :deep(.tiptap .desc-video-node-view[data-align="left"]) {
  margin-right: auto;
  margin-left: 0;
}

.tiptap-wrapper :deep(.tiptap .desc-video-node-view[data-align="center"]) {
  margin-left: auto;
  margin-right: auto;
}

.tiptap-wrapper :deep(.tiptap .desc-video-node-view[data-align="right"]) {
  margin-left: auto;
  margin-right: 0;
}

.tiptap-wrapper :deep(.tiptap .desc-video-node-view video) {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
  background: #111827;
}

.tiptap-wrapper :deep(.tiptap .desc-video-node-view.ProseMirror-selectednode) {
  outline: none;
}

.tiptap-wrapper :deep(.tiptap .desc-video-node-view.ProseMirror-selectednode video) {
  outline: 2px solid rgba(139, 0, 0, 0.35);
  outline-offset: 2px;
}

.tiptap-wrapper :deep(.tiptap img.ProseMirror-selectednode) {
  outline: 2px solid rgba(139, 0, 0, 0.35);
  outline-offset: 2px;
  border-radius: 6px;
}
</style>
