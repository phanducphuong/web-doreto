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
          'tiptap-wrapper--side': props.sideToolbar,
        },
      ]"
    >
      <div v-if="editor && !props.disabled" class="tiptap-sticky-tools">
        <div :class="['tiptap-toolbar', { locked: isEditorLocked, 'tiptap-toolbar--vertical': props.sideToolbar }]">
          <!-- Toggle thiết bị (chỉ ở rail dọc): gộp Mobile/Desktop lên đầu cột -->
          <template v-if="props.sideToolbar && props.enablePreviewWidth">
            <AtomsTooltip content="Xem trên Mobile">
              <button
                type="button"
                :class="['toolbar-btn', { active: props.previewWidth === 'mobile' }]"
                @click="emit('update:previewWidth', 'mobile')"
              >
                <Smartphone class="size-4" />
              </button>
            </AtomsTooltip>
            <AtomsTooltip content="Xem trên Desktop">
              <button
                type="button"
                :class="['toolbar-btn', { active: props.previewWidth === 'desktop' }]"
                @click="emit('update:previewWidth', 'desktop')"
              >
                <Monitor class="size-4" />
              </button>
            </AtomsTooltip>
            <span class="toolbar-divider" />
          </template>
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
          <MoleculesCommonPopover :placement="props.sideToolbar ? 'left-start' : 'bottom-start'">
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
          <MoleculesCommonPopover :placement="props.sideToolbar ? 'left-start' : 'bottom-start'">
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
          <MoleculesCommonPopover :placement="props.sideToolbar ? 'left-start' : 'bottom-start'">
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
            title="Generate AI"
            @click="openAiPromptModal"
          >
            <Loader2 v-if="isGeneratingAi" class="size-4 animate-spin" />
            <Sparkles v-else class="size-4" />
            <span class="toolbar-ai-label">{{ isGeneratingAi ? "Generating..." : "Generate AI" }}</span>
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

        <div
          v-if="selectedImage && !isEditorLocked && !isImageCropEditing"
          ref="imageBarRef"
          class="desc-image-props-bar desc-floating-bar"
          :class="{ 'is-ready': floatingReady }"
          :style="floatingBarStyle"
        >
          <AtomsTooltip content="Thay ảnh khác">
            <button
              type="button"
              class="desc-toolbar-icon-btn"
              :disabled="isUploadingImage"
              @click="openImageReplacePicker"
            >
              <RefreshCw class="size-4" />
            </button>
          </AtomsTooltip>

          <AtomsTooltip content="Cắt ảnh">
            <button
              type="button"
              class="desc-toolbar-icon-btn"
              :disabled="isUploadingImage"
              @click="cropSelectedImage"
            >
              <Crop class="size-4" />
            </button>
          </AtomsTooltip>

          <span class="desc-toolbar-divider" />

          <AtomsTooltip content="Căn trái">
            <button
              type="button"
              class="desc-toolbar-icon-btn"
              :class="{ active: isImageAlignActive('left') }"
              @click="setImageAlign('left')"
            >
              <AlignLeft class="size-4" />
            </button>
          </AtomsTooltip>
          <AtomsTooltip content="Căn giữa">
            <button
              type="button"
              class="desc-toolbar-icon-btn"
              :class="{ active: isImageAlignActive('center') }"
              @click="setImageAlign('center')"
            >
              <AlignCenter class="size-4" />
            </button>
          </AtomsTooltip>
          <AtomsTooltip content="Căn phải">
            <button
              type="button"
              class="desc-toolbar-icon-btn"
              :class="{ active: isImageAlignActive('right') }"
              @click="setImageAlign('right')"
            >
              <AlignRight class="size-4" />
            </button>
          </AtomsTooltip>

          <span class="desc-toolbar-divider" />

          <AtomsTooltip content="Chiều rộng ảnh (%)">
            <span class="desc-toolbar-num">
              <MoveHorizontal class="size-3.5 desc-toolbar-num-icon" />
              <input
                :key="`image-width-${selectedImage.pos}`"
                type="number"
                class="desc-toolbar-num-input"
                min="10"
                max="100"
                step="1"
                :value="selectedImageWidthPercent"
                @input="onImageWidthInput"
                @change="onImageWidthInput"
              />
            </span>
          </AtomsTooltip>

          <AtomsTooltip content="Bo góc ảnh (px)">
            <span class="desc-toolbar-num">
              <SquareRoundCorner class="size-3.5 desc-toolbar-num-icon" />
              <input
                :key="`image-radius-${selectedImage.pos}`"
                type="number"
                class="desc-toolbar-num-input"
                min="0"
                step="1"
                :value="selectedImageRadiusPx"
                @input="onImageRadiusInput"
                @change="onImageRadiusInput"
              />
            </span>
          </AtomsTooltip>

          <AtomsTooltip content="Bóng đổ">
            <select
              class="desc-toolbar-select"
              :value="selectedImage.attrs.imageShadow || 'none'"
              @change="onImageShadowChange"
            >
              <option v-for="item in imageShadowOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </option>
            </select>
          </AtomsTooltip>

          <span class="desc-toolbar-divider" />

          <AtomsTooltip content="Xóa ảnh">
            <button
              type="button"
              class="desc-toolbar-icon-btn is-danger"
              @click="deleteSelectedImage"
            >
              <Trash2 class="size-4" />
            </button>
          </AtomsTooltip>
        </div>

        <div
          v-if="selectedDescBlock && !selectedImage && !isEditorLocked"
          ref="blockBarRef"
          class="desc-block-props-bar desc-floating-bar"
          :class="{ 'is-ready': floatingReady }"
          :style="floatingBarStyle"
        >
          <span class="desc-toolbar-badge">
            {{ selectedDescBlock.attrs.width === "half" ? "½" : "full" }}
          </span>

          <span class="desc-toolbar-divider" />

          <AtomsTooltip content="Di chuyển lên">
            <button
              type="button"
              class="desc-toolbar-icon-btn"
              :disabled="!descBlockMoveInfo.canUp"
              @click="moveSelectedDescBlock(-1)"
            >
              <ArrowUp class="size-4" />
            </button>
          </AtomsTooltip>
          <AtomsTooltip content="Di chuyển xuống">
            <button
              type="button"
              class="desc-toolbar-icon-btn"
              :disabled="!descBlockMoveInfo.canDown"
              @click="moveSelectedDescBlock(1)"
            >
              <ArrowDown class="size-4" />
            </button>
          </AtomsTooltip>
          <AtomsTooltip content="Căn giữa block">
            <button
              type="button"
              class="desc-toolbar-icon-btn"
              :class="{ active: selectedDescBlock.attrs.align === 'center' }"
              @click="toggleDescBlockCenter"
            >
              <AlignCenter class="size-4" />
            </button>
          </AtomsTooltip>

          <span class="desc-toolbar-divider" />

          <AtomsTooltip content="Màu đầu">
            <input
              type="color"
              class="desc-block-color-input"
              :value="selectedDescBlockGradient.from"
              @input="onDescBlockGradientColorLive('from', $event)"
              @change="onDescBlockGradientColorInput('from', $event)"
            />
          </AtomsTooltip>
          <AtomsTooltip content="Màu cuối">
            <input
              type="color"
              class="desc-block-color-input"
              :value="selectedDescBlockGradient.to"
              @input="onDescBlockGradientColorLive('to', $event)"
              @change="onDescBlockGradientColorInput('to', $event)"
            />
          </AtomsTooltip>
          <AtomsTooltip content="Hướng pha màu">
            <select
              class="desc-block-bg-angle"
              :value="selectedDescBlockGradient.angle"
              @change="onDescBlockGradientAngleChange"
            >
              <option
                v-for="item in DESC_BLOCK_GRADIENT_ANGLES"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </option>
            </select>
          </AtomsTooltip>

          <AtomsTooltip content="Bỏ màu nền">
            <button
              type="button"
              class="desc-toolbar-icon-btn"
              @click="updateSelectedDescBlock({ backgroundColor: null })"
            >
              <Ban class="size-4" />
            </button>
          </AtomsTooltip>

          <span class="desc-toolbar-divider" />

          <AtomsTooltip content="Chiều rộng block (%)">
            <span class="desc-toolbar-num">
              <MoveHorizontal class="size-3.5 desc-toolbar-num-icon" />
              <input
                :key="`bw-${selectedDescBlock.pos}`"
                type="number"
                class="desc-toolbar-num-input"
                min="10"
                max="100"
                step="1"
                :value="selectedDescBlockWidthPct"
                @input="onDescBlockWidthInput"
                @change="onDescBlockWidthInput"
              />
            </span>
          </AtomsTooltip>

          <AtomsTooltip content="Chiều cao tối thiểu (px)">
            <span class="desc-toolbar-num">
              <MoveVertical class="size-3.5 desc-toolbar-num-icon" />
              <input
                :key="`bh-${selectedDescBlock.pos}`"
                type="number"
                class="desc-toolbar-num-input"
                min="0"
                step="1"
                :value="selectedDescBlockMinHeightPx"
                @input="onDescBlockMinHeightInput"
                @change="onDescBlockMinHeightInput"
              />
            </span>
          </AtomsTooltip>

          <AtomsTooltip content="Bo góc (px)">
            <span class="desc-toolbar-num">
              <SquareRoundCorner class="size-3.5 desc-toolbar-num-icon" />
              <input
                :key="`radius-${selectedDescBlock.pos}`"
                type="number"
                class="desc-toolbar-num-input"
                min="0"
                step="1"
                :value="selectedDescBlockRadiusPx"
                @input="onDescBlockRadiusInput"
                @change="onDescBlockRadiusInput"
              />
            </span>
          </AtomsTooltip>

          <AtomsTooltip content="Khoảng đệm trong (px)">
            <span class="desc-toolbar-num">
              <Frame class="size-3.5 desc-toolbar-num-icon" />
              <input
                :key="`padding-${selectedDescBlock.pos}`"
                type="number"
                class="desc-toolbar-num-input"
                min="0"
                step="1"
                :value="selectedDescBlockPaddingPx"
                @input="onDescBlockPaddingInput"
                @change="onDescBlockPaddingInput"
              />
            </span>
          </AtomsTooltip>

          <AtomsTooltip content="Bóng đổ">
            <select
              class="desc-toolbar-select"
              :value="selectedDescBlock.attrs.shadow || 'none'"
              @change="onDescBlockShadowChange"
            >
              <option v-for="item in descBlockShadowOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </option>
            </select>
          </AtomsTooltip>

          <span class="desc-toolbar-divider" />

          <AtomsTooltip
            v-if="selectedDescBlock.attrs.blockWidth || selectedDescBlock.attrs.minHeight"
            content="Về cỡ mặc định"
          >
            <button
              type="button"
              class="desc-toolbar-icon-btn"
              @click="resetSelectedDescBlockSize"
            >
              <RotateCcw class="size-4" />
            </button>
          </AtomsTooltip>

          <AtomsTooltip content="Xóa block">
            <button
              type="button"
              class="desc-toolbar-icon-btn is-danger"
              @click="deleteSelectedDescBlock"
            >
              <Trash2 class="size-4" />
            </button>
          </AtomsTooltip>
        </div>
      </div>
      <div
        ref="contentAreaRef"
        :class="['tiptap-content-area', { 'is-framed': props.enablePreviewWidth }]"
        :data-preview="props.enablePreviewWidth ? props.previewWidth : undefined"
        @mousedown="onEditorAreaMouseDown"
      >
        <div class="tiptap-content-frame" :style="contentFrameStyle">
          <EditorContent :editor="editor" />
        </div>
      </div>
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
  isGradientValue,
  parseGradientValue,
  buildGradientValue,
  type TDescBlockAttrs,
  type TDescBlockShadow,
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
  Crop,
  MoveHorizontal,
  MoveVertical,
  SquareRoundCorner,
  Frame,
  RotateCcw,
  Ban,
  Smartphone,
  Monitor,
  ArrowUp,
  ArrowDown,
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
    // Nếu truyền: bấm chèn/thay ảnh sẽ mở popup chọn ảnh từ kho ảnh sản phẩm
    // (trả URL ảnh có sẵn để chèn thẳng, hoặc File mới để crop+upload như cũ).
    // Bỏ trống: giữ hành vi cũ (mở hộp chọn file của trình duyệt).
    pickProductImage?: () => Promise<{ url?: string; file?: File } | null>;
    // Bật khung xem trước theo thiết bị (thu khung soạn về đúng bề ngang thiết bị)
    enablePreviewWidth?: boolean;
    // Bề ngang xem trước, do component cha điều khiển (nút Mobile/Desktop ở header)
    previewWidth?: "mobile" | "desktop";
    // Xếp thanh công cụ + toggle thiết bị thành cột dọc bên phải (dùng cho popup rộng)
    // -> nhường tối đa chiều dọc cho vùng xem trước.
    sideToolbar?: boolean;
  }>(),
  {
    modelValue: "",
    disabled: false,
    allowAiGenerate: true,
    aiName: "",
    aiCategoryNames: () => [],
    aiTagNames: () => [],
    aiReplaceContent: false,
    enablePreviewWidth: false,
    previewWidth: "mobile",
    sideToolbar: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "update:previewWidth", value: "mobile" | "desktop"): void;
}>();

// Xem trước theo thiết bị (nút Mobile/Desktop nằm ở header, cha truyền xuống qua prop)
// mobile 414px: cỡ điện thoại phổ biến (iPhone 11/XR/Plus...), sát thực tế hơn 390px
const PREVIEW_WIDTHS = { mobile: 414, desktop: 820 } as const;
const contentFrameStyle = computed(() => {
  if (!props.enablePreviewWidth) return {};
  return { maxWidth: `${PREVIEW_WIDTHS[props.previewWidth]}px`, margin: "0 auto" };
});

const { $api } = useNuxtApp();
const toast = useToast();
const { uploadFiles } = useUploadFiles();
const imageInputRef = ref<HTMLInputElement | null>(null);
const videoInputRef = ref<HTMLInputElement | null>(null);
const imageCropModalRef =
  ref<{ open: (source: File | string, options?: { aspectRatio?: number }) => Promise<File | null> }>();
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

const selectedDescBlockWidthPct = computed(() => {
  const raw = selectedDescBlock.value?.attrs.blockWidth;
  if (!raw) return 100;
  const match = String(raw).trim().match(/^(\d+(?:\.\d+)?)%$/);
  return match ? Math.round(Number(match[1])) : 100;
});

const selectedDescBlockMinHeightPx = computed(() =>
  selectedDescBlock.value?.attrs.minHeight
    ? parseCssPx(selectedDescBlock.value.attrs.minHeight, 0)
    : 0,
);

// Màu nền block: "solid" (1 màu) hoặc "gradient" (2 màu pha nhau)
const DESC_BLOCK_GRADIENT_ANGLES = [
  { label: "↓", value: 180 },
  { label: "↑", value: 0 },
  { label: "→", value: 90 },
  { label: "←", value: 270 },
  { label: "↘", value: 135 },
  { label: "↙", value: 225 },
] as const;

const selectedDescBlockBg = computed(() => selectedDescBlock.value?.attrs.backgroundColor ?? null);

// Luôn quy về gradient 2 màu. Block cũ đang là màu đơn -> tách thành from=to (giữ nguyên
// diện mạo cho tới khi user đổi 1 trong 2 màu); không có nền -> dùng gradient mặc định.
const selectedDescBlockGradient = computed(() => {
  const bg = selectedDescBlockBg.value;
  const parsed = parseGradientValue(bg);
  if (parsed) return parsed;
  if (bg && !isGradientValue(bg)) return { from: bg, to: bg, angle: 180 };
  return { from: "#f7f4f3", to: "#ece3dd", angle: 180 };
});

const selectedImagePos = ref<number | null>(null);
const selectedImageAttrs = ref<TDescImageAttrs | null>(null);

const selectedImage = computed(() => {
  if (selectedImagePos.value === null || !selectedImageAttrs.value) return null;
  return {
    pos: selectedImagePos.value,
    attrs: selectedImageAttrs.value,
  };
});

// ===== Thanh công cụ nổi: bám ngay cạnh ảnh/block đang chọn (giống WebCake) =====
const contentAreaRef = ref<HTMLElement | null>(null);

// Đang cắt ảnh tại chỗ -> ẩn thanh công cụ ảnh nổi để không đè lên nút "Xong cắt ảnh"
const isImageCropEditing = ref(false);
const onImageCropEditing = (event: Event) => {
  isImageCropEditing.value = Boolean((event as CustomEvent).detail?.editing);
};
// Bỏ chọn ảnh (kể cả xóa ảnh giữa lúc cắt) -> gỡ trạng thái đang-cắt cho chắc
watch(selectedImage, (img) => {
  if (!img) isImageCropEditing.value = false;
});
const imageBarRef = ref<HTMLElement | null>(null);
const blockBarRef = ref<HTMLElement | null>(null);
const floatingBarStyle = ref<Record<string, string>>({ top: "0px", left: "0px" });
const floatingReady = ref(false);

const updateFloatingBar = () => {
  const instance = editor.value;
  if (!instance) return;

  let pos: number | null = null;
  let barEl: HTMLElement | null = null;
  if (selectedImage.value) {
    pos = selectedImagePos.value;
    barEl = imageBarRef.value;
  } else if (selectedDescBlock.value) {
    pos = selectedDescBlockPos.value;
    barEl = blockBarRef.value;
  }
  if (pos === null || !barEl) {
    floatingReady.value = false;
    return;
  }

  // Lấy DOM của node đang chọn để đo vị trí
  let node: Node | null = null;
  try {
    node = instance.view.nodeDOM(pos) as Node | null;
  } catch {
    node = null;
  }
  const el =
    node && node.nodeType === 1 ? (node as HTMLElement) : (node?.parentElement ?? null);
  if (!el || typeof el.getBoundingClientRect !== "function") return;

  const rect = el.getBoundingClientRect();
  const container = contentAreaRef.value;
  const cRect = container ? container.getBoundingClientRect() : null;

  const barW = barEl.offsetWidth || 0;
  const barH = barEl.offsetHeight || 0;
  const gap = 4;
  const pad = 4;

  // Thanh dính CỨNG ngay trên đỉnh ảnh/block, cuộn cùng ảnh, không lật xuống.
  const top = rect.top - barH - gap;

  // Kẹp theo bề ngang KHUNG SOẠN (không phải cả màn hình) để không tràn ra ngoài.
  const areaLeft = cRect ? cRect.left : 0;
  const areaRight = cRect ? cRect.right : window.innerWidth;
  const areaWidth = areaRight - areaLeft;
  let left = rect.left;
  const maxLeft = areaRight - barW - pad;
  const minLeft = areaLeft + pad;
  if (left > maxLeft) left = maxLeft;
  if (left < minLeft) left = minLeft;

  // Kéo/cuộn quá: ảnh ra khỏi vùng soạn -> thanh chìm theo ảnh (ẩn), không nhảy chỗ.
  if (cRect && (top < cRect.top - 1 || rect.top > cRect.bottom)) {
    floatingReady.value = false;
    return;
  }

  floatingBarStyle.value = {
    top: `${Math.round(top)}px`,
    left: `${Math.round(left)}px`,
    maxWidth: `${Math.round(areaWidth - pad * 2)}px`,
  };
  floatingReady.value = true;
};

let floatingRaf = 0;
const scheduleFloatingUpdate = () => {
  if (!import.meta.client) return;
  if (floatingRaf) cancelAnimationFrame(floatingRaf);
  floatingRaf = requestAnimationFrame(() => {
    floatingRaf = 0;
    updateFloatingBar();
  });
};

// Cập nhật vị trí khi đổi lựa chọn / thuộc tính (kéo resize, đổi màu...)
watch([selectedImage, selectedDescBlock], () => scheduleFloatingUpdate(), { deep: true });

let floatingResizeObserver: ResizeObserver | null = null;
const onFloatingScrollOrResize = () => scheduleFloatingUpdate();

onMounted(() => {
  if (!import.meta.client) return;
  // capture=true để bắt cả cuộn của khung soạn (khi bật xem trước có scroll riêng)
  window.addEventListener("scroll", onFloatingScrollOrResize, true);
  window.addEventListener("resize", onFloatingScrollOrResize);
  if (contentAreaRef.value && "ResizeObserver" in window) {
    floatingResizeObserver = new ResizeObserver(() => scheduleFloatingUpdate());
    floatingResizeObserver.observe(contentAreaRef.value);
  }
  // Sự kiện tùy chỉnh (có gạch nối) nên gắn tay để tránh lỗi casing của @ trên thẻ native
  contentAreaRef.value?.addEventListener("desc-image-crop-editing", onImageCropEditing);
});

// Bỏ chọn ảnh/block hoàn toàn (ẩn thanh nổi) - dùng khi bấm ra vùng trắng
const clearDescSelection = () => {
  const instance = editor.value;
  if (instance) {
    const sel = instance.state.selection;
    // Đưa NodeSelection (ảnh/block) về con trỏ text để bỏ viền chọn, rồi bỏ focus.
    if (sel instanceof NodeSelection) {
      instance.chain().setTextSelection(sel.from).run();
    }
    instance.commands.blur();
  }
  selectedImagePos.value = null;
  selectedImageAttrs.value = null;
  selectedDescBlockPos.value = null;
  selectedDescBlockAttrs.value = null;
  floatingReady.value = false;
};

// Bấm vào vùng trắng 2 bên (ngoài ảnh/chữ) -> bỏ chọn ảnh/block
const onEditorAreaMouseDown = (event: MouseEvent) => {
  if (!(selectedImage.value || selectedDescBlock.value)) return;
  const target = event.target as HTMLElement | null;
  if (!target || typeof target.closest !== "function") return;
  // Đang thao tác trên thanh nổi hoặc kéo tay cầm -> giữ nguyên
  if (target.closest(".desc-floating-bar") || target.closest(".desc-block-handle")) return;

  if (selectedImage.value) {
    // Đang chọn ảnh: chỉ giữ khi bấm trúng đúng ảnh/video; vùng trắng quanh ảnh -> bỏ chọn
    if (target.closest("img, video")) return;
    clearDescSelection();
    return;
  }

  // Đang chọn block (con trỏ trong block): bấm vào nội dung editor thì để ProseMirror
  // tự xử lý (gõ chữ / chuyển block); chỉ bỏ chọn khi bấm ra vùng trắng ngoài nội dung.
  if (target.closest(".ProseMirror")) return;
  clearDescSelection();
};

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

// Cập nhật nền block NGAY khi đang kéo màu trong bộ chọn (để preview sống).
// Không focus lại editor (tránh làm đóng bộ chọn màu native) và không ghi từng
// bước kéo vào lịch sử undo. Bước chốt cuối sẽ do @change (updateSelectedDescBlock) lo.
const setDescBlockBackgroundLive = (backgroundColor: string) => {
  const instance = editor.value;
  const pos = selectedDescBlockPos.value;
  if (!instance || pos === null || !selectedDescBlockAttrs.value) return;
  const node = instance.state.doc.nodeAt(pos);
  if (!node || node.type.name !== "descBlock") return;
  const nextAttrs = { ...selectedDescBlockAttrs.value, backgroundColor };
  const tr = instance.state.tr.setNodeMarkup(pos, undefined, nextAttrs);
  tr.setMeta("addToHistory", false);
  instance.view.dispatch(tr);
  selectedDescBlockAttrs.value = nextAttrs;
};

// Đổi một trong hai màu của gradient (bản LIVE: gọi liên tục khi kéo trong bộ chọn màu)
const onDescBlockGradientColorLive = (which: "from" | "to", event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  const next = { ...selectedDescBlockGradient.value, [which]: value };
  setDescBlockBackgroundLive(buildGradientValue(next));
};

// Đổi một trong hai màu của gradient (bản CHỐT: khi đóng bộ chọn màu -> ghi undo 1 bước)
const onDescBlockGradientColorInput = (which: "from" | "to", event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  const next = { ...selectedDescBlockGradient.value, [which]: value };
  updateSelectedDescBlock({ backgroundColor: buildGradientValue(next) });
};

// Số thứ tự trong cha -> biết block có thể lên/xuống được không (để bật/tắt nút)
const descBlockMoveInfo = computed(() => {
  const instance = editor.value;
  const pos = selectedDescBlockPos.value;
  if (!instance || pos === null) return { canUp: false, canDown: false };
  try {
    const $pos = instance.state.doc.resolve(pos);
    const index = $pos.index();
    return { canUp: index > 0, canDown: index < $pos.parent.childCount - 1 };
  } catch {
    return { canUp: false, canDown: false };
  }
});

// Di chuyển block lên (-1) / xuống (+1) trong cùng nhóm cha bằng transaction ProseMirror.
const moveSelectedDescBlock = (dir: -1 | 1) => {
  const instance = editor.value;
  const pos = selectedDescBlockPos.value;
  if (!instance || pos === null) return;
  const { state } = instance;
  const $pos = state.doc.resolve(pos);
  const parent = $pos.parent;
  const index = $pos.index();
  const targetIndex = index + dir;
  if (targetIndex < 0 || targetIndex >= parent.childCount) return; // đã ở đầu/cuối
  const node = state.doc.nodeAt(pos);
  if (!node || node.type.name !== "descBlock") return;

  const tr = state.tr;
  tr.delete(pos, pos + node.nodeSize);
  // Sau khi xoá, block liền kề đã dịch chỗ; tính vị trí chèn mới.
  const newPos =
    dir === 1 ? pos + parent.child(index + 1).nodeSize : pos - parent.child(index - 1).nodeSize;
  tr.insert(newPos, node);
  tr.setSelection(NodeSelection.create(tr.doc, newPos));
  instance.view.dispatch(tr.scrollIntoView());
};

// Bật/tắt căn giữa block (align: left <-> center)
const toggleDescBlockCenter = () => {
  const cur = selectedDescBlockAttrs.value?.align;
  updateSelectedDescBlock({ align: cur === "center" ? "left" : "center" });
};

const descBlockShadowOptions: { label: string; value: TDescBlockShadow }[] = [
  { label: "Không", value: "none" },
  { label: "Nhẹ", value: "sm" },
  { label: "Vừa", value: "md" },
  { label: "Đậm", value: "lg" },
];

const onDescBlockShadowChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value as TDescBlockShadow;
  updateSelectedDescBlock({ shadow: value });
};

// Đổi hướng (góc) gradient
const onDescBlockGradientAngleChange = (event: Event) => {
  const angle = Number((event.target as HTMLSelectElement).value);
  const next = { ...selectedDescBlockGradient.value, angle };
  updateSelectedDescBlock({ backgroundColor: buildGradientValue(next) });
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

const onDescBlockWidthInput = (event: Event) => {
  const raw = (event.target as HTMLInputElement).value;
  if (raw === "") return;
  const pct = Math.min(100, Math.max(10, Number(raw)));
  updateSelectedDescBlock({ blockWidth: `${pct}%` });
};

const onDescBlockMinHeightInput = (event: Event) => {
  const raw = (event.target as HTMLInputElement).value;
  if (raw === "") return;
  const px = Math.max(0, Number(raw));
  updateSelectedDescBlock({ minHeight: px > 0 ? toCssPx(px) : null });
};

const resetSelectedDescBlockSize = () => {
  updateSelectedDescBlock({ blockWidth: null, minHeight: null });
};

const deleteSelectedDescBlock = () => {
  const instance = editor.value;
  if (!instance || selectedDescBlockPos.value === null) return;

  const { state } = instance;
  const pos = selectedDescBlockPos.value;
  const node = state.doc.nodeAt(pos);
  if (!node || node.type.name !== "descBlock") {
    selectedDescBlockPos.value = null;
    selectedDescBlockAttrs.value = null;
    return;
  }

  let from = pos;
  let to = pos + node.nodeSize;

  // Nếu block nằm trong hàng 2 cột và là block cuối cùng còn lại -> xóa cả hàng
  // (hàng không được rỗng nên nếu chỉ xóa block sẽ bị kẹt, không xóa sạch được)
  const $pos = state.doc.resolve(pos);
  const parent = $pos.parent;
  if (parent.type.name === "descBlockRow" && parent.childCount <= 1) {
    from = $pos.before($pos.depth);
    to = from + parent.nodeSize;
  }

  instance.chain().focus().deleteRange({ from, to }).run();
  selectedDescBlockPos.value = null;
  selectedDescBlockAttrs.value = null;
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

// Nút "Cắt ảnh": vào chế độ cắt tại chỗ (phóng to, hiện full ảnh, kéo/zoom)
const cropSelectedImage = () => {
  if (props.disabled || !editor.value) return;
  const el = editor.value.view.dom.querySelector(
    ".desc-image-node-view.ProseMirror-selectednode",
  );
  el?.dispatchEvent(new CustomEvent("desc-image-crop-start"));
};

// (Đã bỏ crop bằng popup khi đúp ảnh — giờ crop tại chỗ ngay trong node view.)

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

// HTML mới nhất mà editor tự phát ra (đã sanitize). Dùng để nhận biết "echo" của
// chính mình trong watch(modelValue) -> KHÔNG setContent lại (tránh dựng lại node view).
const lastEmittedHtml = ref("");

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
    const html = sanitizeHtmlBeforeEmit(editorInstance.getHTML());
    lastEmittedHtml.value = html;
    emit("update:modelValue", html);
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

// Chèn/thay ảnh vào editor bằng URL đã có (không upload lại).
const applyImageUrlToEditor = (src: string, alt: string, shouldReplace: boolean) => {
  if (!editor.value) return;
  if (shouldReplace) {
    (editor.value.chain().focus() as any).updateAttributes("image", { src, alt }).run();
    syncSelectedImage();
  } else {
    (editor.value.chain().focus() as any).setImage({ src, alt }).run();
  }
};

// Crop + upload 1 file rồi chèn/thay vào editor (luồng cũ, tách ra để dùng lại).
const processImageFile = async (file: File, mode: "insert" | "replace") => {
  if (!editor.value || !imageCropModalRef.value) return;
  if (!file.type.startsWith("image/")) {
    toast.error({ message: "Vui lòng chọn file ảnh hợp lệ." });
    return;
  }

  const croppedFile = await imageCropModalRef.value.open(file);
  if (!croppedFile) return;

  const shouldReplaceImage = mode === "replace" && editor.value.isActive("image");

  try {
    isUploadingImage.value = true;
    const [imageUrl] = await uploadFiles([croppedFile], { preset: "description" });
    if (!imageUrl) {
      throw new Error("Image upload returned empty URL");
    }
    applyImageUrlToEditor(imageUrl, croppedFile.name, shouldReplaceImage);
  } catch {
    toast.error({ message: "Upload ảnh thất bại." });
  } finally {
    isUploadingImage.value = false;
  }
};

// Mở nguồn chọn ảnh: có popup kho ảnh SP thì ưu tiên, không thì mở hộp chọn file.
const runImagePicker = async (mode: "insert" | "replace") => {
  if (isUploadingImage.value || isUploadingVideo.value) return;
  imageUploadMode.value = mode;

  if (props.pickProductImage) {
    const res = await props.pickProductImage();
    if (!res) return;
    if (res.url) {
      const shouldReplace = mode === "replace" && Boolean(editor.value?.isActive("image"));
      applyImageUrlToEditor(res.url, "", shouldReplace);
    } else if (res.file) {
      await processImageFile(res.file, mode);
    }
    return;
  }

  imageInputRef.value?.click();
};

const openImagePicker = () => runImagePicker("insert");

const openImageReplacePicker = () => runImagePicker("replace");

const onImageSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = "";
  if (!file) return;
  await processImageFile(file, imageUploadMode.value);
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
    if (!editor.value) return;
    // Bỏ qua echo của chính editor: giá trị vừa emit ra, hoặc trùng với nội dung hiện tại
    // (so cùng-hệ: sanitize cả hai vế, vì getHTML() và bản sanitize serialize khác nhau).
    if (val === lastEmittedHtml.value) return;
    if (val !== sanitizeHtmlBeforeEmit(editor.value.getHTML())) {
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
  if (import.meta.client) {
    window.removeEventListener("scroll", onFloatingScrollOrResize, true);
    window.removeEventListener("resize", onFloatingScrollOrResize);
    floatingResizeObserver?.disconnect();
    contentAreaRef.value?.removeEventListener("desc-image-crop-editing", onImageCropEditing);
    if (floatingRaf) cancelAnimationFrame(floatingRaf);
  }
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

/* Khung soạn: khi bật xem trước thì có nền xám + căn giữa để thấy đúng bề ngang thiết bị */
.tiptap-content-area.is-framed {
  background: #ece7e5;
  padding: 8px;
  /* Popup mô tả đã bỏ footer + header gọn -> nhường tối đa chiều dọc cho vùng xem trước
     (thấy được nhiều ảnh/nội dung hơn trong 1 màn) */
  max-height: 82vh;
  overflow-y: auto;
}

.tiptap-content-area.is-framed .tiptap-content-frame {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgb(0 0 0 / 8%);
  /* KHÔNG overflow:hidden để không cắt mất box-shadow của ảnh bên trong */
}

/* Trong khung xem trước: padding ngang của vùng soạn khớp ĐÚNG trang sản phẩm thật
   để chữ xuống dòng giống hệt (mobile: section px-2 = 8px; desktop: section p-6 = 24px).
   Trước đây dùng 12px của .tiptap nên khung chữ hẹp hơn -> câu bị xuống dòng sớm hơn. */
.tiptap-content-area.is-framed[data-preview="mobile"] :deep(.tiptap) {
  padding-left: 8px;
  padding-right: 8px;
}

.tiptap-content-area.is-framed[data-preview="desktop"] :deep(.tiptap) {
  padding-left: 24px;
  padding-right: 24px;
}

/* ------- Rail dọc: toolbar + toggle thiết bị dồn sang cột bên phải ------- */
/* (dùng cho popup rộng) -> nhường toàn bộ chiều dọc cho vùng xem trước */
.tiptap-wrapper--side {
  display: flex;
  flex-direction: row;
  align-items: stretch;
}

.tiptap-wrapper--side .tiptap-content-area {
  order: 1;
  flex: 1 1 auto;
  min-width: 0;
}

.tiptap-wrapper--side .tiptap-sticky-tools {
  order: 2;
  position: static;
  flex: 0 0 auto;
  display: flex;
  border-radius: 0 6px 6px 0;
}

/* Vùng soạn cao hết cỡ khi ở chế độ rail dọc (không còn thanh nào chiếm chiều dọc) */
.tiptap-wrapper--side .tiptap-content-area.is-framed {
  max-height: 86vh;
}

.tiptap-toolbar--vertical {
  flex-direction: column;
  align-items: center;
  flex-wrap: nowrap;
  gap: 3px;
  padding: 6px 5px;
  border-bottom: none;
  border-left: 1px solid #b6b6b6;
  max-height: 86vh;
  overflow-y: auto;
  overflow-x: hidden;

  .toolbar-btn {
    width: 30px;
    height: 30px;
  }

  .toolbar-divider {
    width: 18px;
    height: 1px;
    margin: 2px 0;
  }

  /* Ẩn nhãn chữ -> rail gọn dạng icon, các nút về vuông đều nhau */
  .font-family-preview,
  .font-size-preview,
  .toolbar-ai-label {
    display: none;
  }

  .toolbar-btn-preview,
  .toolbar-ai-btn,
  .toolbar-color-picker {
    width: 30px;
    padding: 0;
    gap: 0;
  }
}

.tiptap-toolbar {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-bottom: 1px solid #b6b6b6;
  flex-wrap: wrap;
  background: #fff;

  .toolbar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 27px;
    height: 27px;
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
    height: 18px;
    background: #b6b6b6;
    margin: 0 2px;
  }

  .toolbar-select {
    height: 27px;
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

.tiptap-wrapper :deep(.tiptap .desc-block-node-view) {
  position: relative;
}

/* Viền gợi ý khi rê chuột / đang soạn trong block -> biết ranh giới để kéo */
.tiptap-wrapper :deep(.tiptap .desc-block-node-view:hover),
.tiptap-wrapper :deep(.tiptap .desc-block-node-view:focus-within) {
  outline: 1px dashed rgba(139, 0, 0, 0.4);
  outline-offset: 2px;
}

.tiptap-wrapper :deep(.tiptap .desc-block-handle) {
  position: absolute;
  width: 16px;
  height: 16px;
  background: #8b0000;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
  opacity: 0;
  transition: opacity 0.15s ease;
  z-index: 30;
  touch-action: none;
}

/* Mở rộng vùng bấm quanh tay cầm cho dễ trúng (kể cả khi tay cầm nhỏ) */
.tiptap-wrapper :deep(.tiptap .desc-block-handle)::before {
  content: "";
  position: absolute;
  inset: -10px;
}

/* Hiện tay cầm khi rê chuột, đang soạn trong block, HOẶC khi block đang được chọn
   (bấm tay cầm di chuyển -> block được chọn -> mọi tay cầm luôn hiện, dễ thao tác) */
.tiptap-wrapper :deep(.tiptap .desc-block-node-view:hover .desc-block-handle),
.tiptap-wrapper :deep(.tiptap .desc-block-node-view:focus-within .desc-block-handle),
.tiptap-wrapper :deep(.tiptap .desc-block-node-view.ProseMirror-selectednode .desc-block-handle) {
  opacity: 1;
}

/* Đặt tay cầm ngay bên trong mép block để không bị tuột chuột ra ngoài khi kéo */
.tiptap-wrapper :deep(.tiptap .desc-block-handle--e) {
  top: 50%;
  right: 2px;
  transform: translateY(-50%);
  cursor: ew-resize;
}

.tiptap-wrapper :deep(.tiptap .desc-block-handle--s) {
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  cursor: ns-resize;
}

.tiptap-wrapper :deep(.tiptap .desc-block-handle--se) {
  right: 2px;
  bottom: 2px;
  cursor: nwse-resize;
}

.desc-block-props-bar,
.desc-image-props-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 3px;
  padding: 5px 6px;
  border-bottom: 1px solid #e5e7eb;
  background: #fafafa;
}

/* ===== Nút icon gọn trên thanh nổi (giống toolbar chính) ===== */
.desc-toolbar-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #374151;
  cursor: pointer;
  transition:
    background 0.12s ease,
    color 0.12s ease;
}

.desc-toolbar-icon-btn:hover:not(:disabled) {
  background: #f0eeed;
}

.desc-toolbar-icon-btn.active {
  background: #8b0000;
  color: #fff;
}

.desc-toolbar-icon-btn.is-danger:hover:not(:disabled) {
  background: #fdeceb;
  color: #b91c1c;
}

.desc-toolbar-icon-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.desc-toolbar-divider {
  width: 1px;
  align-self: stretch;
  margin: 3px 2px;
  background: #e5e7eb;
}

.desc-toolbar-badge {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: #f1eae8;
  font-size: 11px;
  font-weight: 700;
  color: #8b0000;
}

/* Cụm icon + ô số (chiều rộng, bo góc, padding...) */
.desc-toolbar-num {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 30px;
  padding: 0 4px 0 6px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
}

.desc-toolbar-num-icon {
  color: #9ca3af;
  flex-shrink: 0;
}

.desc-toolbar-num-input {
  width: 40px;
  height: 26px;
  border: none;
  background: transparent;
  font-size: 12px;
  color: #374151;
  text-align: center;
  outline: none;
  -moz-appearance: textfield;
  appearance: textfield;
}

.desc-toolbar-num-input::-webkit-outer-spin-button,
.desc-toolbar-num-input::-webkit-inner-spin-button {
  margin: 0;
  -webkit-appearance: none;
  appearance: none;
}

.desc-toolbar-select {
  height: 30px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  padding: 0 6px;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
}

/* Thanh công cụ nổi bám cạnh ảnh/block đang chọn */
.desc-floating-bar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 60;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 8px 24px rgb(0 0 0 / 18%);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.1s ease;
}

.desc-floating-bar.is-ready {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
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
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
}

.desc-block-bg-mode {
  display: inline-flex;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
}

.desc-block-bg-mode-btn {
  border: none;
  background: #fff;
  padding: 4px 8px;
  font-size: 11px;
  color: #505050;
  cursor: pointer;
}

.desc-block-bg-mode-btn + .desc-block-bg-mode-btn {
  border-left: 1px solid #d1d5db;
}

.desc-block-bg-mode-btn.is-active {
  background: #8b0000;
  color: #fff;
}

.desc-block-bg-angle {
  height: 30px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  padding: 0 4px;
  font-size: 14px;
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

/* Tay cầm kéo đổi kích thước ảnh (8 điểm: 4 góc + 4 cạnh) — chỉ hiện khi ảnh được chọn */
.tiptap-wrapper :deep(.tiptap .desc-image-node-view .desc-image-handle) {
  display: none;
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background: #8b0000;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgb(0 0 0 / 30%);
  z-index: 3;
  touch-action: none;
}

.tiptap-wrapper :deep(.tiptap .desc-image-node-view.ProseMirror-selectednode .desc-image-handle) {
  display: block;
}

.tiptap-wrapper :deep(.tiptap .desc-image-node-view .desc-image-handle--nw) {
  top: -7px;
  left: -7px;
}

.tiptap-wrapper :deep(.tiptap .desc-image-node-view .desc-image-handle--ne) {
  top: -7px;
  right: -7px;
}

.tiptap-wrapper :deep(.tiptap .desc-image-node-view .desc-image-handle--sw) {
  bottom: -7px;
  left: -7px;
}

.tiptap-wrapper :deep(.tiptap .desc-image-node-view .desc-image-handle--se) {
  bottom: -7px;
  right: -7px;
}

.tiptap-wrapper :deep(.tiptap .desc-image-node-view .desc-image-handle--n) {
  top: -7px;
  left: 50%;
  transform: translateX(-50%);
}

.tiptap-wrapper :deep(.tiptap .desc-image-node-view .desc-image-handle--s) {
  bottom: -7px;
  left: 50%;
  transform: translateX(-50%);
}

.tiptap-wrapper :deep(.tiptap .desc-image-node-view .desc-image-handle--e) {
  right: -7px;
  top: 50%;
  transform: translateY(-50%);
}

.tiptap-wrapper :deep(.tiptap .desc-image-node-view .desc-image-handle--w) {
  left: -7px;
  top: 50%;
  transform: translateY(-50%);
}

/* Đang cắt ảnh tại chỗ: ẩn tay cầm resize khung cho gọn */
.tiptap-wrapper :deep(.tiptap .desc-image-node-view[data-crop-editing] .desc-image-handle) {
  display: none;
}

/* Lớp phủ làm tối phần ảnh NGOÀI khung (khoét đúng khung) khi đang cắt */
.tiptap-wrapper :deep(.tiptap .desc-image-crop-overlay) {
  position: absolute;
  left: 0;
  top: 0;
  box-shadow: 0 0 0 9999px rgb(0 0 0 / 55%);
  outline: 1px dashed rgb(255 255 255 / 90%);
  pointer-events: none;
  z-index: 4;
}

/* Thanh kéo zoom dọc, NGOÀI mép phải khung khi đang cắt */
.tiptap-wrapper :deep(.tiptap .desc-image-zoom-bar) {
  position: absolute;
  left: 100%;
  margin-left: 12px;
  top: 50%;
  height: 70%;
  transform: translateY(-50%);
  writing-mode: vertical-lr;
  direction: rtl;
  accent-color: #8b0000;
  background: rgb(255 255 255 / 90%);
  border-radius: 999px;
  padding: 4px 2px;
  z-index: 8;
  cursor: pointer;
}

/* Nút "Xong" khi đang cắt (góc trên phải khung) */
/* Nút "Xong cắt ảnh": to, rõ, nằm giữa phía trên khung (nổi trên ảnh) để dễ thấy/bấm,
   không còn nép góc phải bé xíu đè lên thanh công cụ ảnh. */
.tiptap-wrapper :deep(.tiptap .desc-image-crop-done) {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: 999px;
  background: #8b0000;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  border: 2px solid #fff;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 4px 14px rgb(0 0 0 / 40%);
}

.tiptap-wrapper :deep(.tiptap .desc-image-crop-done:hover) {
  background: #a30f0f;
}

.tiptap-wrapper :deep(.tiptap .desc-image-crop-done svg) {
  display: block;
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
