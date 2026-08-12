<template>
  <MoleculesCommonModal
    ref="modalRef"
    :header="formLabel"
    :is-show-close="true"
    :width="1000"
    :close-on-click-overlay="false"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <span class="text-base font-semibold text-on-surface whitespace-nowrap">
          {{ formLabel }}
        </span>

        <!-- Xem trước mô tả theo thiết bị (điều khiển khung soạn ở phần Mô tả) -->
        <div class="flex items-center gap-0.5 rounded-full bg-#F1EAE8 p-0.5">
          <button
            type="button"
            class="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors"
            :class="previewMode === 'mobile' ? 'bg-primary text-white' : 'text-on-surface-variant'"
            @click="previewMode = 'mobile'"
          >
            <Smartphone class="size-3.5" />
            Mobile
          </button>
          <button
            type="button"
            class="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors"
            :class="previewMode === 'desktop' ? 'bg-primary text-white' : 'text-on-surface-variant'"
            @click="previewMode = 'desktop'"
          >
            <Monitor class="size-3.5" />
            Desktop
          </button>
        </div>

        <div class="ml-auto flex items-center gap-2">
          <AtomsButton
            v-if="defaultData?._id"
            type="danger"
            class="min-h-9 text-sm"
            :icon="Trash"
            :is-loading="loadingStates.delete"
            @click="onDeleteProduct"
          >
            Xóa
          </AtomsButton>
          <AtomsButton
            type="primary"
            class="min-h-9 text-sm"
            :icon="Save"
            :is-loading="loadingStates.upsert"
            @click="onSubmit"
          >
            {{ defaultData?._id ? "Cập nhật" : "Tạo mới" }}
          </AtomsButton>
        </div>
      </div>
    </template>

    <div class="vcu-product-modal space-y-6 pb-6 mt-2">
      <section class="space-y-5">
        <p class="section-title">Thông tin cơ bản</p>

        <AtomsFormItem
          label="Tên sản phẩm"
          :required="true"
          :error-message="formError.name"
          class-label="text-on-surface col-span-1 md:col-span-2"
        >
          <AtomsFormInput
            v-model="productForm.name"
            :disabled="!isEdit"
            :error="formError.name"
            placeholder="Nhập tên sản phẩm"
            @update:model-value="onNameInput"
          />
        </AtomsFormItem>

        <AtomsFormItem
          label="Đường dẫn (slug)"
          :error-message="formError.slug"
          class-label="text-on-surface"
        >
          <AtomsFormInput
            v-model="productForm.slug"
            :disabled="!isEdit"
            :error="formError.slug"
            placeholder="vd: den-trang-tri-cao-cap"
            @update:model-value="onSlugInput"
            @blur="checkSlugAvailability"
          />
          <p class="mt-1 text-xs text-on-surface-variant">
            URL: <span class="font-medium">/san-pham/{{ productForm.slug || "…" }}</span>
            <span v-if="slugChecking"> · đang kiểm tra…</span>
            <span v-else-if="productForm.slug && slugAvailable === true" class="text-primary">
              · slug dùng được
            </span>
          </p>
          <p v-if="!defaultData?._id" class="text-xs text-on-surface-variant">
            Để trống sẽ tự tạo từ tên. Slug cố định sau khi lưu — đổi tên sẽ không tự đổi slug.
          </p>
          <p v-else class="text-xs text-amber-600">
            Slug cố định. Chỉ đổi khi thật sự cần — ảnh hưởng SEO và các link đã chia sẻ.
          </p>
        </AtomsFormItem>

        <div class="mt-4 space-y-4">
          <AtomsFormItem label="Khung ảnh mô tả">
            <MoleculesProductDescriptionFramePicker
              v-model="productForm.descriptionFrameId"
              :frames="activeDescriptionFrames"
              :loading="loadingDescriptionFrames"
              :disabled="!isEdit"
            />
          </AtomsFormItem>

          <AtomsFormItem label="Mô tả" :error-message="formError.description">
            <div class="mb-1 flex justify-end">
              <AtomsButton type="link" class="!min-h-0 text-xs" @click="openDescriptionPopup">
                <Maximize2 class="size-3.5" /> Mở rộng để chỉnh sửa
              </AtomsButton>
            </div>
            <!-- Đúp chuột vào vùng mô tả (không phải ảnh) -> mở popup rộng cho dễ sửa -->
            <div @dblclick="onDescriptionAreaDblClick">
              <AtomsTiptapEditor
                v-model="productForm.description"
                :disabled="!isEdit"
                :error="formError.description"
                :ai-name="productForm.name || ''"
                :ai-category-names="selectedCategoryNames"
                :ai-tag-names="selectedTagNames"
                :allow-ai-generate="false"
                :ai-replace-content="false"
                :pick-product-image="openImageFromProduct"
                enable-preview-width
                :preview-width="previewMode"
              />
            </div>
          </AtomsFormItem>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AtomsFormItem label="Danh mục" :required="true" :error-message="formError.categoryIds">
            <AtomsFormSelectBox
              v-model="productForm.categoryIds!"
              :options="categories.map((c) => ({ label: c.name, value: c._id! }))"
              is-multiple
              :disabled="!isEdit"
              :error="formError.categoryIds"
            />
          </AtomsFormItem>

          <AtomsFormItem label="Tag" :error-message="formError.tagIds">
            <AtomsFormSelectBox
              v-model="productForm.tagIds!"
              :options="tags?.map((c) => ({ label: c.name, value: c._id! })) || []"
              is-multiple
              :disabled="!isEdit"
              :error="formError.tagIds"
            />
          </AtomsFormItem>
        </div>

        <AtomsFormItem label="Sản phẩm tương tự">
          <AtomsFormSelectBox
            v-model="productForm.similarProductIds!"
            :options="similarProductOptions"
            is-multiple
            clearable
            wide
            :disabled="!isEdit"
            placeholder="Chọn tối đa 6 sản phẩm hiển thị ở mục 'Sản phẩm tương tự'"
          />
          <p class="mt-1 text-xs text-on-surface-variant">
            Nếu bỏ trống, trang chi tiết sẽ tự hiển thị ngẫu nhiên các sản phẩm bán chạy.
          </p>
        </AtomsFormItem>
      </section>

      <section class="space-y-5">
        <div class="flex gap-3">
          <p class="section-title mb-0">Hình ảnh & Truyền thông</p>
          <p class="ml-auto mb-1 text-xs text-#D2ACA8">{{ productImageCount }} / 10 Hình ảnh</p>
        </div>

        <AtomsFormItem
          label="Hình ảnh sản phẩm"
          :required="true"
          :error-message="formError.imageUrls"
        >
          <div class="grid gap-4 md:grid-cols-[1fr_auto]">
            <MoleculesFilePicker
              v-model:files="productForm.imageFiles"
              v-model:urls="productForm.imageUrls"
              :featured="effectiveFeaturedKey"
              enable-featured
              :disabled="!isEdit"
              multiple
              accept=".png,.webp,.jpg,.jpeg"
              @update:featured="featuredImageKey = $event"
            />

            <!-- * PREVIEW ẢNH ĐẠI DIỆN (ảnh đầu trang chi tiết) -->
            <div class="shrink-0 md:w-64">
              <p class="mb-2 text-xs font-semibold text-on-surface-variant">Ảnh đại diện</p>
              <div v-if="featuredPreviewUrl" class="space-y-2">
                <button
                  type="button"
                  class="group relative block w-full overflow-hidden rounded-md border border-primary/40"
                  :disabled="!isEdit"
                  title="Bấm để cắt ảnh"
                  @click="openFeaturedCrop"
                >
                  <img
                    :src="featuredPreviewUrl"
                    alt="Xem trước ảnh đại diện"
                    class="block aspect-4/5 w-full object-cover"
                  />
                  <span
                    v-if="isEdit"
                    class="absolute inset-0 hidden items-center justify-center gap-1.5 bg-black/35 text-xs font-semibold text-white group-hover:flex"
                  >
                    <Crop class="size-4" /> Cắt ảnh
                  </span>
                </button>
                <p class="text-[11px] leading-snug text-on-surface-variant">
                  Ảnh hiển thị đầu tiên khi khách mở trang chi tiết sản phẩm. Bấm vào ảnh để cắt.
                </p>
              </div>
              <div
                v-else
                class="center-child aspect-4/5 w-full rounded-md border border-dashed border-outline-variant text-center text-[11px] text-on-surface-variant"
              >
                Chưa có ảnh.<br />Bấm ngôi sao ở một ảnh để chọn đại diện.
              </div>
            </div>
          </div>
        </AtomsFormItem>

        <AtomsFormItem
          label="Ảnh thumbnail"
          :required="true"
          :error-message="formError.thumbnailUrls"
        >
          <div class="space-y-2">
            <p class="text-xs text-on-surface-variant">
              Ảnh nhỏ đại diện sản phẩm ở danh mục, sản phẩm tương tự, giỏ hàng và đơn hàng. Chỉ
              chọn 1 ảnh (khác với ảnh đại diện ở trang chi tiết phía trên).
            </p>
            <div class="flex flex-wrap gap-3">
              <div
                v-for="(thumb, idx) in thumbnailDisplayUrls"
                :key="`${thumb}-${idx}`"
                class="group relative h-20 w-20 overflow-hidden rounded-lg border border-primary-container/50"
              >
                <button
                  type="button"
                  class="block h-full w-full"
                  :disabled="!isEdit"
                  title="Bấm để cắt ảnh"
                  @click="openThumbnailCrop(idx)"
                >
                  <img :src="thumb" alt="thumbnail" class="h-full w-full object-cover" />
                  <span
                    v-if="isEdit"
                    class="absolute inset-0 hidden items-center justify-center bg-black/35 text-white group-hover:flex"
                  >
                    <Crop class="size-4" />
                  </span>
                </button>
                <button
                  v-if="isEdit"
                  class="absolute right-1 top-1 z-10 hidden h-5 w-5 items-center justify-center rounded-full bg-primary-container text-white group-hover:flex"
                  @click.prevent="removeThumbnail(idx)"
                >
                  <X class="size-3" />
                </button>
              </div>

              <AtomsSingleImagePicker
                v-if="isEdit && thumbnailDisplayUrls.length < 1"
                :file="null"
                :image-url="''"
                pick-mode
                @pick="openThumbnailPicker"
              />
            </div>
          </div>
        </AtomsFormItem>
      </section>

      <section class="space-y-5">
        <div class="mb-4 flex flex-wrap items-center gap-2">
          <p class="section-title">Cấu hình biến thể</p>
          <AtomsButton
            v-if="isEdit"
            type="link"
            class="ml-auto font-semibold"
            @click="productForm.optionValues!.push(createDefaultOptionValue())"
          >
            Thêm lựa chọn
          </AtomsButton>
        </div>

        <div class="rounded-xl bg-#EFEBEB p-4">
          <div class="mb-3 grid grid-cols-[230px_1fr] uppercase text-xs font-semibold gap-3">
            <p>Tên tùy chọn</p>
            <div class="flex items-center justify-between">
              Giá trị
              <AtomsButton
                circle
                type="ghost"
                class="text-primary"
                :icon="Plus"
                @click="productOptionValues.push(createOptionDef())"
              />
            </div>
          </div>
          <div
            v-for="(item, optionIndex) in productOptionValues"
            :key="item._uid"
            class="grid gap-3 md:grid-cols-[230px_1fr] mb-3 last:mb-0"
          >
            <AtomsFormInput
              v-model="item.name"
              :disabled="!isEdit"
              :error="formError.productOptions"
              placeholder="Nhập thông số"
            />
            <div class="flex items-center gap-2">
              <AtomsFormTagInput
                v-model="item.value"
                class="flex-1"
                :disabled="!isEdit"
                :error="formError.productOptions"
                placeholder="Nhập thông số"
              />
              <AtomsButton
                circle
                type="ghost"
                class="text-danger"
                :icon="Trash"
                :disabled="productOptionValues.length <= 1"
                @click="removeProductOptionValue(optionIndex)"
              ></AtomsButton>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[920px] border-collapse">
            <thead>
              <tr
                class="border-b border-#E4D4D1 text-left text-xs uppercase tracking-[0.06em] text-#8B7B78"
              >
                <th class="py-3">Ảnh</th>
                <th class="py-3">Biến thể</th>
                <th class="py-3">Mã biến thể</th>
                <th class="py-3">Giá bán</th>
                <th class="py-3">Giá gốc</th>
                <th class="py-3">Kho</th>
                <th class="py-3 text-right">Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(value, id) in productForm.optionValues"
                :key="value._id || id"
                class="border-b border-#EEE5E3 align-top"
              >
                <td class="py-4 pr-3">
                  <AtomsSingleImagePicker
                    class="!w-12 !h-12"
                    :file="value.imageFile?.[0] || null"
                    :image-url="value.imageUrl || ''"
                    :disabled="!isEdit"
                    pick-mode
                    @pick="openVariantImagePicker(id)"
                  />
                  <p v-if="formError.optionValues?.[id]?.imageUrl" class="mt-1 text-xs text-danger">
                    {{ formError.optionValues?.[id]?.imageUrl }}
                  </p>
                </td>
                <td class="py-4 pr-3 w-1/5">
                  <MoleculesCommonPopover placement="bottom-start">
                    <p class="font-semibold text-xs cursor-pointer">
                      {{
                        value.productOptionNames?.filter(Boolean).join(" / ") ||
                        `Lựa chọn ${id + 1}`
                      }}
                    </p>
                    <template #content>
                      <div class="w-[320px] max-h-[300px] overflow-y-auto space-y-4 p-1">
                        <template v-if="variantOptionDefinitions.length">
                          <div
                            v-for="(option, optionIndex) in variantOptionDefinitions"
                            :key="`${option.name}-${optionIndex}`"
                            class="space-y-2"
                          >
                            <p
                              class="text-[10px] font-bold uppercase tracking-widest text-stone-400"
                            >
                              {{ option.name }}
                            </p>
                            <div class="flex flex-wrap gap-2">
                              <button
                                v-for="optionValue in option.values"
                                :key="`${option.name}-${optionValue}`"
                                type="button"
                                :disabled="!isEdit"
                                class="px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm border border-#f0d9d3 disabled:(opacity-50 cursor-not-allowed)"
                                :class="
                                  isOptionPicked(id, optionIndex, optionValue)
                                    ? 'ring-(primary 2) bg-primary/5 text-on-surface'
                                    : 'bg-surface text-stone-500 hover:ring-(outline-variant/60 1)'
                                "
                                @click.stop="toggleOptionValue(id, optionIndex, optionValue)"
                              >
                                {{ optionValue }}
                              </button>
                            </div>
                          </div>
                        </template>
                        <p v-else class="text-xs text-on-surface-variant">
                          Chưa có cấu hình tùy chọn. Hãy nhập tên và giá trị ở phía trên.
                        </p>
                      </div>
                    </template>
                  </MoleculesCommonPopover>
                  <p v-if="getOptionValueError(id)" class="mt-1 text-xs text-danger">
                    {{ getOptionValueError(id) }}
                  </p>
                  <p v-if="duplicateOptionValueIndexes.has(id)" class="mt-1 text-xs text-danger">
                    Tổ hợp biến thể trùng với dòng khác
                  </p>
                </td>
                <td class="py-4 pr-3 w-36">
                  <AtomsFormInput
                    v-model="value.code"
                    :disabled="!isEdit"
                    placeholder="VD: SP-001-RED-L"
                    maxlength="100"
                    :error="formError.optionValues?.[id]?.code"
                  />
                </td>
                <td class="py-4 pr-3">
                  <AtomsFormInput
                    v-model="value.price"
                    :disabled="!isEdit"
                    placeholder="Giá bán"
                    :format="formatPrice"
                    :parse="parsePrice"
                    :error="formError.optionValues?.[id]?.price"
                  />
                </td>
                <td class="py-4 pr-3">
                  <AtomsFormInput
                    v-model="value.originalPrice"
                    :disabled="!isEdit"
                    placeholder="Giá gốc"
                    :format="formatPrice"
                    :parse="parsePrice"
                    :error="formError.optionValues?.[id]?.originalPrice"
                  />
                </td>
                <td class="py-4 pr-3 w-30">
                  <AtomsFormInput
                    v-model="value.stock"
                    :disabled="!isEdit"
                    placeholder="Số lượng"
                    type="number"
                    :error="formError.optionValues?.[id]?.stock"
                  />
                </td>
                <td class="py-4 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <AtomsButton
                      v-if="isEdit"
                      class="w-8 h-8"
                      type="ghost"
                      circle
                      :icon="Copy"
                      @click="duplicateOptionValue(id)"
                    />
                    <AtomsButton
                      v-if="isEdit"
                      class="w-8 h-8"
                      type="ghost"
                      circle
                      :icon="X"
                      :disabled="(productForm.optionValues || []).length <= 1"
                      @click="deleteOptionValue(id)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="space-y-5">
        <div class="mb-2 flex flex-wrap items-center gap-2">
          <p class="section-title mb-0">Combo theo số lượng</p>
          <AtomsButton
            v-if="isEdit"
            type="link"
            class="ml-auto font-semibold"
            @click="addComboTier"
          >
            Thêm bậc combo
          </AtomsButton>
        </div>
        <p class="text-xs text-on-surface-variant">
          Bậc giá theo TỔNG số sản phẩm khách mua (mua N cái = giá gói). Ví dụ: 1 cái, combo 2 cái
          (freeship), combo 3 cái… Khách chọn combo trước, rồi chọn màu cho từng cái, size chọn 1
          lần. Bỏ trống nếu sản phẩm không bán theo combo.
        </p>

        <div v-if="(productForm.comboTiers || []).length" class="overflow-x-auto">
          <table class="w-full min-w-[720px] border-collapse">
            <thead>
              <tr
                class="border-b border-#E4D4D1 text-left text-xs uppercase tracking-[0.06em] text-#8B7B78"
              >
                <th class="py-3 w-28">Số lượng</th>
                <th class="py-3">Giá combo</th>
                <th class="py-3">Giá gốc</th>
                <th class="py-3 w-24 text-center">Freeship</th>
                <th class="py-3">Nhãn (tùy chọn)</th>
                <th class="py-3 text-right">Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(tier, tierIndex) in productForm.comboTiers"
                :key="tierIndex"
                class="border-b border-#EEE5E3 align-top"
              >
                <td class="py-4 pr-3">
                  <AtomsFormInput
                    v-model="tier.quantity"
                    :disabled="!isEdit"
                    type="number"
                    placeholder="VD: 2"
                  />
                </td>
                <td class="py-4 pr-3">
                  <AtomsFormInput
                    v-model="tier.price"
                    :disabled="!isEdit"
                    placeholder="Giá gói"
                    :format="formatPrice"
                    :parse="parsePrice"
                  />
                </td>
                <td class="py-4 pr-3">
                  <AtomsFormInput
                    v-model="tier.originalPrice"
                    :disabled="!isEdit"
                    placeholder="Giá gạch"
                    :format="formatPrice"
                    :parse="parsePrice"
                  />
                </td>
                <td class="py-4 pr-3 text-center">
                  <input
                    v-model="tier.freeship"
                    type="checkbox"
                    :disabled="!isEdit"
                    class="size-4 accent-primary"
                  />
                </td>
                <td class="py-4 pr-3">
                  <AtomsFormInput
                    v-model="tier.label"
                    :disabled="!isEdit"
                    placeholder="VD: Combo 2 quần"
                    maxlength="60"
                  />
                </td>
                <td class="py-4 text-right">
                  <AtomsButton
                    v-if="isEdit"
                    class="w-8 h-8"
                    type="ghost"
                    circle
                    :icon="X"
                    @click="removeComboTier(tierIndex)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div
          v-else
          class="rounded-lg border border-dashed border-outline-variant p-4 text-center text-xs text-on-surface-variant"
        >
          Chưa có bậc combo. Bấm “Thêm bậc combo” để thêm (không bắt buộc).
        </div>
      </section>

      <section class="space-y-4">
        <p class="section-title mb-0">Sẵn sàng lưu thay đổi</p>
        <div
          v-if="!errorList.length"
          class="mb-4 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3"
        >
          <CheckCircle2 class="size-4 text-primary" />
          <p class="text-xs text-primary">Tất cả các trường bắt buộc đã được điền đầy đủ.</p>
        </div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div class="rounded-lg bg-surface-container p-3">
            <p class="text-xs text-on-surface-variant">Ảnh sản phẩm</p>
            <p class="mt-1 text-base font-semibold">{{ productImageCount }}</p>
          </div>
          <div class="rounded-lg bg-surface-container p-3">
            <p class="text-xs text-on-surface-variant">Thumbnail</p>
            <p class="mt-1 text-base font-semibold">
              {{ (productForm.thumbnailUrls || []).length }}
            </p>
          </div>
          <div class="rounded-lg bg-surface-container p-3">
            <p class="text-xs text-on-surface-variant">Biến thể</p>
            <p class="mt-1 text-base font-semibold">
              {{ (productForm.optionValues || []).length }}
            </p>
          </div>
          <div class="rounded-lg bg-surface-container p-3">
            <p class="text-xs text-on-surface-variant">Khoảng giá</p>
            <p class="mt-1 text-base font-semibold">{{ priceRangeLabel }}</p>
          </div>
        </div>

        <div
          v-if="errorList.length"
          class="mt-4 rounded-lg border border-danger/40 bg-danger/5 p-3"
        >
          <p class="text-sm font-semibold text-danger">
            Cần xử lý {{ errorList.length }} lỗi trước khi lưu
          </p>
          <ul class="mt-2 list-disc pl-4 text-xs text-danger space-y-1">
            <li v-for="(error, idx) in errorList" :key="idx">{{ error }}</li>
          </ul>
        </div>
      </section>
    </div>

    <MoleculesImageCropModal ref="imageCropModalRef" />

    <MoleculesProductImagePicker ref="imageFromProductPickerRef" />

    <!-- Popup rộng chỉnh sửa mô tả (cùng nội dung với editor trong form) -->
    <MoleculesCommonModal
      ref="descriptionModalRef"
      :width="1080"
      :is-show-close="true"
      :close-on-click-overlay="false"
      header-class="px-5 py-3"
    >
      <!-- Header gọn: tiêu đề nhỏ + nút Xong. Toggle thiết bị đã dồn xuống rail dọc bên phải editor -->
      <template #header>
        <div class="flex items-center gap-3">
          <span class="text-sm font-semibold text-on-surface whitespace-nowrap">
            Chỉnh sửa mô tả
          </span>

          <AtomsButton
            type="primary"
            class="ml-auto min-h-9 text-sm"
            :icon="Check"
            @click="closeDescriptionPopup"
          >
            Xong
          </AtomsButton>
        </div>
      </template>

      <div class="pt-1">
        <AtomsTiptapEditor
          v-model="productForm.description"
          :disabled="!isEdit"
          :error="formError.description"
          :ai-name="productForm.name || ''"
          :ai-category-names="selectedCategoryNames"
          :ai-tag-names="selectedTagNames"
          :allow-ai-generate="false"
          :ai-replace-content="false"
          :pick-product-image="openImageFromProduct"
          enable-preview-width
          side-toolbar
          v-model:preview-width="previewMode"
        />
      </div>
    </MoleculesCommonModal>
  </MoleculesCommonModal>
</template>

<script setup lang="ts">
import { Check, CheckCircle2, Copy, Crop, Maximize2, Monitor, Plus, Save, Smartphone, Trash, X } from "lucide-vue-next";
import useImageFrame from "~/composables/image-frame.composable";
import useProduct from "~/composables/product.composable";
import type { TActiveImageFrame } from "~/types/image-frame.type";
import type { TComboTier, TExistedProduct } from "~/types/product.type";
import MoleculesCommonModal from "~/components/molecules/common/Modal.vue";
import { hasError, generateSlug } from "~/utils/data.utils";
import { getShortProductName, getDisplayPurchaseCount } from "~/utils/product.utils";
import type { TMediaCompressionPreset } from "~/constants/media-compression.constant";
import { compressImageFile } from "~/utils/media-compression.utils";
import type { TExistedTag } from "~/types/tag.type";

const modalRef = ref<InstanceType<typeof MoleculesCommonModal>>();

const { defaultData, tags = [] } = defineProps<{
  defaultData?: TExistedProduct;
  tags?: TExistedTag[];
}>();

const { loadingStates, upsertProduct, deleteProduct, validateProductForm } = useProduct();
const { fetchActiveFrames, loadingStates: imageFrameLoadingStates } = useImageFrame();
const { $uploadRepository, $productRepository } = useNuxtApp();
const { categories } = storeToRefs(useCategoryStore());
const toast = useToast();
const isEdit = ref(false);
// Xem trước mô tả theo thiết bị (nút Mobile/Desktop ở header), mặc định Mobile
const previewMode = ref<"mobile" | "desktop">("mobile");

// Popup rộng chỉnh sửa mô tả
const descriptionModalRef = ref<InstanceType<typeof MoleculesCommonModal>>();
const openDescriptionPopup = () => descriptionModalRef.value?.openModal();
const closeDescriptionPopup = () => descriptionModalRef.value?.closeModal();
const onDescriptionAreaDblClick = (event: MouseEvent) => {
  // Bấm đúp vào ẢNH -> để editor xử lý crop, KHÔNG mở popup mô tả
  if ((event.target as HTMLElement | null)?.closest(".desc-image-node-view")) return;
  openDescriptionPopup();
};
const activeDescriptionFrames = ref<TActiveImageFrame[]>([]);
const loadingDescriptionFrames = computed(() => imageFrameLoadingStates.value.fetchActive);

const productForm = ref<Partial<TExistedProduct>>({});
const thumbnailPreviewUrls = ref<string[]>([]);

// Danh sách sản phẩm để chọn "sản phẩm tương tự" (tối đa 6)
const MAX_SIMILAR_PRODUCTS = 6;
const allProductsForPicker = ref<
  { _id: string; name: string; image?: string; sold: number }[]
>([]);

// Ưu tiên sản phẩm bán chạy: sắp theo tổng lượt mua (thật + ảo) giảm dần
const similarProductOptions = computed(() =>
  [...allProductsForPicker.value]
    .filter((p) => p._id !== defaultData?._id)
    .sort((a, b) => b.sold - a.sold)
    .map((p) => ({
      label: getShortProductName(p.name),
      value: p._id,
      image: p.image,
      title: p.name,
    })),
);

const fetchProductsForPicker = async () => {
  try {
    const res = await $productRepository.getMany({
      page: 1,
      limit: 1000,
      sortBy: "purchaseCount",
      sortOrder: "desc",
    });
    allProductsForPicker.value = (res.data || []).map((p) => ({
      _id: p._id,
      name: p.name,
      image: p.thumbnailUrls?.[0] || p.imageUrls?.[0] || "",
      sold: getDisplayPurchaseCount(p),
    }));
  } catch (error) {
    console.error("Failed to fetch products for similar picker:", error);
  }
};

// Chặn chọn quá 6 sản phẩm tương tự
watch(
  () => productForm.value.similarProductIds,
  (ids) => {
    if (ids && ids.length > MAX_SIMILAR_PRODUCTS) {
      productForm.value.similarProductIds = ids.slice(0, MAX_SIMILAR_PRODUCTS);
    }
  },
  { deep: true },
);

// Ảnh đại diện: lưu key (url với ảnh đã tải, fileKey với file mới chưa upload)
const featuredImageKey = ref<string>("");
const featuredFilePreviewUrl = ref<string>("");
const getFileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

const selectedDescriptionFrame = computed(
  () =>
    activeDescriptionFrames.value.find(
      (frame) => frame._id === productForm.value.descriptionFrameId,
    ) ?? null,
);

const formError = ref<any>({});

// * SLUG: tự sinh từ tên khi TẠO mới (chưa sửa tay), kiểm trùng qua BE.
const slugTouched = ref(false);
const slugChecking = ref(false);
const slugAvailable = ref<boolean | null>(null);
let slugCheckTimer: ReturnType<typeof setTimeout> | null = null;

const runSlugCheck = async () => {
  const raw = (productForm.value.slug || "").trim();
  slugAvailable.value = null;
  if (!raw) {
    // Tạo mới: để trống hợp lệ (BE tự sinh từ tên). Sửa: bắt buộc có slug.
    formError.value.slug = defaultData?._id ? "Slug không được để trống" : undefined;
    return;
  }
  try {
    slugChecking.value = true;
    const excludeId = defaultData?._id ? String(defaultData._id) : undefined;
    const res = await $productRepository.checkSlugAvailable(raw, excludeId);
    slugAvailable.value = res.available;
    formError.value.slug = res.available
      ? undefined
      : "Slug đã tồn tại, vui lòng chọn slug khác";
  } catch {
    // Lỗi mạng: không chặn thao tác, BE vẫn kiểm tra lại lúc lưu
  } finally {
    slugChecking.value = false;
  }
};

const scheduleSlugCheck = () => {
  if (slugCheckTimer) clearTimeout(slugCheckTimer);
  slugCheckTimer = setTimeout(runSlugCheck, 400);
};

const onSlugInput = () => {
  slugTouched.value = true;
  formError.value.slug = undefined;
  scheduleSlugCheck();
};

const checkSlugAvailability = () => runSlugCheck();

// Gõ tên -> tự điền slug NGAY (không phụ thuộc timing của watch). Chỉ khi TẠO
// mới và admin chưa tự sửa slug. SP đã tồn tại: slug cố định, đổi tên KHÔNG đổi slug.
// Lấy value trực tiếp từ event, không phụ thuộc thứ tự cập nhật của v-model.
const onNameInput = (value: string | number) => {
  if (defaultData?._id || slugTouched.value) return;
  productForm.value.slug = generateSlug(String(value ?? ""));
  scheduleSlugCheck();
};

const emits = defineEmits(["on-upsert-product-success", "on-delete-product-success"]);

const defaultOptionValue = {
  price: 0,
  productOptionNames: [],
  imageUrl: "",
  imageFile: [],
};

let _optionUidCounter = 0;
const createOptionDef = () => ({ _uid: ++_optionUidCounter, name: "", value: [] as string[] });
const productOptionValues = ref<{ _uid: number; name: string; value: string[] }[]>([
  createOptionDef(),
]);

const createDefaultOptionValue = () => ({
  code: "",
  price: defaultOptionValue.price,
  productOptionNames: [] as string[],
  imageUrl: defaultOptionValue.imageUrl,
  imageFile: [] as File[],
});

// * COMBO theo tổng số lượng (tầng giá phủ lên biến thể màu/size)
const createDefaultComboTier = (): TComboTier => ({
  quantity: 1,
  price: 0,
  originalPrice: undefined,
  freeship: false,
  label: "",
});

const addComboTier = () => {
  productForm.value.comboTiers ||= [];
  productForm.value.comboTiers.push(createDefaultComboTier());
};

const removeComboTier = (index: number) => {
  productForm.value.comboTiers?.splice(index, 1);
};

// Chuẩn hóa combo trước khi lưu: bỏ dòng trống/không hợp lệ, ép đúng kiểu số.
const sanitizeComboTiers = () => {
  productForm.value.comboTiers = (productForm.value.comboTiers || [])
    .map((tier) => {
      const original = Number(tier.originalPrice);
      return {
        quantity: Math.max(1, Math.floor(Number(tier.quantity) || 0)),
        price: Number(tier.price) || 0,
        originalPrice: Number.isFinite(original) && original > 0 ? original : undefined,
        freeship: !!tier.freeship,
        label: (tier.label || "").trim() || undefined,
      };
    })
    .filter((tier) => tier.quantity >= 1 && tier.price > 0)
    .sort((a, b) => a.quantity - b.quantity);
};

const buildVariantOptionValues = (data?: Partial<TExistedProduct>) => {
  if (!data?.productOptions?.length) return [createOptionDef()];

  return data.productOptions.map((optionName, optionIndex) => ({
    _uid: ++_optionUidCounter,
    name: optionName || "",
    value: Array.from(
      new Set(
        (data.optionValues || [])
          .map((optionValue) => optionValue.productOptionNames?.[optionIndex] || "")
          .filter(Boolean),
      ),
    ),
  }));
};

// * COMPUTED
const formLabel = computed(() => {
  if (defaultData?._id) {
    return isEdit.value ? "Cập nhật sản phẩm" : "Thông tin sản phẩm";
  }
  return "Tạo mới sản phẩm";
});

const priceRangeLabel = computed(() => {
  const prices = (productForm.value.optionValues || [])
    .map((item) => Number(item.price || 0))
    .filter((price) => price > 0);
  if (!prices.length) return "Chưa có";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return `${formatPrice(min)} - ${formatPrice(max)}`;
});

const errorList = computed(() => {
  const errors: string[] = [];
  if (formError.value?.name) errors.push(formError.value.name);
  if (formError.value?.slug) errors.push(formError.value.slug);
  if (formError.value?.categoryIds) errors.push(formError.value.categoryIds);
  if (formError.value?.imageUrls) errors.push(formError.value.imageUrls);
  if (formError.value?.thumbnailUrls) errors.push(formError.value.thumbnailUrls);
  if (formError.value?.productOptions) errors.push(formError.value.productOptions);
  if (duplicateOptionValueIndexes.value.size > 0) {
    errors.push(
      `Có ${duplicateOptionValueIndexes.value.size} biến thể bị trùng tổ hợp (dòng: ${[...duplicateOptionValueIndexes.value].map((i) => i + 1).join(", ")})`,
    );
  }
  formError.value?.optionValues?.forEach((item: any, index: number) => {
    if (item?.imageUrl) errors.push(`Lựa chọn ${index + 1}: ${item.imageUrl}`);
    if (item?.code) errors.push(`Lựa chọn ${index + 1}: ${item.code}`);
    if (item?.price) errors.push(`Lựa chọn ${index + 1}: ${item.price}`);
    if (item?.originalPrice) errors.push(`Lựa chọn ${index + 1}: ${item.originalPrice}`);
    item?.productOptionNames?.forEach((optionError: string, optionIndex: number) => {
      if (optionError) {
        errors.push(`Lựa chọn ${index + 1}, thông số ${optionIndex + 1}: ${optionError}`);
      }
    });
  });
  return errors;
});

const thumbnailDisplayUrls = computed(() => [
  ...(productForm.value.thumbnailUrls || []),
  ...thumbnailPreviewUrls.value,
]);

const productImageCount = computed(
  () => (productForm.value.imageUrls || []).length + (productForm.value.imageFiles || []).length,
);

// Danh sách key của toàn bộ ảnh gallery (url trước, file mới sau) – dùng để chọn đại diện
const galleryImageKeys = computed(() => [
  ...(productForm.value.imageUrls || []),
  ...(productForm.value.imageFiles || []).map(getFileKey),
]);

// Key đại diện thực tế: nếu key đã chọn còn tồn tại thì dùng, không thì mặc định ảnh đầu tiên
const effectiveFeaturedKey = computed(() => {
  if (featuredImageKey.value && galleryImageKeys.value.includes(featuredImageKey.value)) {
    return featuredImageKey.value;
  }
  return galleryImageKeys.value[0] || "";
});

const featuredPreviewUrl = computed(() => {
  const key = effectiveFeaturedKey.value;
  if (!key) return "";
  if ((productForm.value.imageUrls || []).includes(key)) return key;
  return featuredFilePreviewUrl.value;
});

const variantOptionDefinitions = computed(() =>
  productOptionValues.value
    .map((item) => ({
      name: (item.name || "").trim(),
      values: (item.value || []).map((value) => value.trim()).filter(Boolean),
    }))
    .filter((item) => item.name && item.values.length),
);

const selectedCategoryNames = computed(() =>
  (productForm.value.categoryIds || [])
    .map((id) => categories.value.find((category) => category._id === id)?.name)
    .filter((name): name is string => Boolean(name)),
);

const selectedTagNames = computed(() =>
  (productForm.value.tagIds || [])
    .map((id) => tags.find((tag) => tag._id === id)?.name)
    .filter((name): name is string => Boolean(name)),
);

// Tính toán độc lập – không phụ thuộc vào errors object
const duplicateOptionValueIndexes = computed(() => {
  const fingerprintMap = new Map<string, number>();
  const duplicates = new Set<number>();

  (productForm.value.optionValues || []).forEach((optionValue, index) => {
    const picked = (optionValue.productOptionNames || []).filter((n) => !!n?.trim());
    if (!picked.length) return; // skip rows chưa chọn gì – đã có validate riêng

    const fingerprint = picked.join("|");
    if (fingerprintMap.has(fingerprint)) {
      duplicates.add(fingerprintMap.get(fingerprint)!);
      duplicates.add(index);
    } else {
      fingerprintMap.set(fingerprint, index);
    }
  });

  return duplicates;
});

// * METHODS
const syncVariantOptionsToForm = () => {
  const optionNames = variantOptionDefinitions.value.map((item) => item.name);
  productForm.value.productOptions = optionNames;

  productForm.value.optionValues = (productForm.value.optionValues || []).map((optionValue) => ({
    ...optionValue,
    productOptionNames: optionNames.map((_, optionIndex) =>
      (optionValue.productOptionNames?.[optionIndex] || "").trim(),
    ),
  }));
};

const hasAtLeastOnePickedOption = (optionNames?: string[]) => {
  return (optionNames || []).some((name) => !!name?.trim());
};

const appendSelectionErrors = (errors: any) => {
  // Chỉ áp dụng "at least 1" khi đã có option attributes
  if (!variantOptionDefinitions.value.length) return;

  const optionValues = productForm.value.optionValues || [];
  optionValues.forEach((optionValue, index) => {
    if (hasAtLeastOnePickedOption(optionValue.productOptionNames)) return;
    errors.optionValues ||= [];
    errors.optionValues[index] ||= {};
    errors.optionValues[index].productOptionNames = ["Vui lòng chọn ít nhất 1 giá trị biến thể"];
  });
};

const onSubmit = async () => {
  try {
    loadingStates.value.upsert = true;
    syncVariantOptionsToForm();
    sanitizeComboTiers();
    productForm.value.optionValues?.forEach((optionValue) => {
      if (typeof optionValue.code === "string") {
        const trimmedCode = optionValue.code.trim();
        optionValue.code = trimmedCode || undefined;
      }
    });
    const errors = validateProductForm(productForm.value);
    appendSelectionErrors(errors);

    // Slug: sửa SP thì bắt buộc có slug; nếu BE báo trùng thì chặn lưu.
    const slugRaw = (productForm.value.slug || "").trim();
    productForm.value.slug = slugRaw || undefined;
    if (defaultData?._id && !slugRaw) {
      errors.slug = "Slug không được để trống";
    } else if (slugAvailable.value === false) {
      errors.slug = "Slug đã tồn tại, vui lòng chọn slug khác";
    }

    // Duplicate check độc lập – không phụ thuộc vào errors mutation
    if (duplicateOptionValueIndexes.value.size > 0 || hasError(errors)) {
      formError.value = errors;
      const firstError = errorList.value[0];
      toast.error({
        message: firstError
          ? `Chưa lưu được: ${firstError}`
          : "Còn lỗi cần sửa trước khi lưu.",
      });
      return;
    }

    // Ghi nhận ảnh đại diện trước khi upload (key có thể là url cũ hoặc file mới)
    const featuredKeyAtSubmit = effectiveFeaturedKey.value;
    const preUploadUrlCount = (productForm.value.imageUrls || []).length;
    const featuredFileIndex = (productForm.value.imageFiles || []).findIndex(
      (file) => getFileKey(file) === featuredKeyAtSubmit,
    );

    await uploadNewAsset();

    moveFeaturedImageToFront(featuredKeyAtSubmit, preUploadUrlCount, featuredFileIndex);

    const response = await upsertProduct(productForm.value);
    if (response) {
      emits("on-upsert-product-success");
      modalRef.value?.closeModal();
    }
  } catch (error) {
    console.error(error);
  } finally {
    loadingStates.value.upsert = false;
  }
};

const onDeleteProduct = () => {
  deleteProduct(defaultData?._id!).then(() => {
    modalRef.value?.closeModal();
    emits("on-delete-product-success");
  });
};
// * Upload ảnh rồi thay đổi luôn ref image
const UPLOAD_PRESET_BY_TASK: Record<"image" | "thumbnail" | "option", TMediaCompressionPreset> = {
  image: "product",
  thumbnail: "thumbnail",
  option: "option",
};

const uploadNewAsset = async () => {
  const tasks: { type: "image" | "thumbnail" | "option"; ref: any }[] = [];
  const files: File[] = [];

  if (productForm.value.imageFiles) {
    productForm.value.imageFiles.forEach((file) => {
      files.push(file);
      tasks.push({ type: "image", ref: null });
    });
  }

  if (productForm.value.thumbnailFiles) {
    productForm.value.thumbnailFiles.forEach((file) => {
      files.push(file);
      tasks.push({ type: "thumbnail", ref: null });
    });
  }

  productForm.value.optionValues?.forEach((value) => {
    if (!value.imageFile?.length) return;
    value.imageFile.forEach((file) => {
      files.push(file);
      tasks.push({ type: "option", ref: value });
    });
  });

  if (!files.length) return;

  const compressedFiles = await Promise.all(
    files.map((file, index) => {
      const task = tasks[index];
      const preset = task ? UPLOAD_PRESET_BY_TASK[task.type] : "product";
      return compressImageFile(file, preset);
    }),
  );

  const uploadGroups = new Map<
    string,
    {
      preset: (typeof UPLOAD_PRESET_BY_TASK)[keyof typeof UPLOAD_PRESET_BY_TASK];
      indices: number[];
    }
  >();

  tasks.forEach((task, index) => {
    const preset = task ? UPLOAD_PRESET_BY_TASK[task.type] : "product";
    const group = uploadGroups.get(preset) ?? { preset, indices: [] };
    group.indices.push(index);
    uploadGroups.set(preset, group);
  });

  const urls = new Array<string>(files.length).fill("");

  await Promise.all(
    [...uploadGroups.values()].map(async ({ preset, indices }) => {
      const groupFiles = indices.map((index) => compressedFiles[index]!);
      const res = await $uploadRepository.uploadFiles(groupFiles, { preset });
      indices.forEach((index, groupIndex) => {
        urls[index] = res.data[groupIndex]?.url || "";
      });
    }),
  );

  let i = 0;
  tasks.forEach((task) => {
    if (task.type === "image") {
      productForm.value.imageUrls ||= [];
      productForm.value.imageUrls.push(urls[i]!);
    }

    if (task.type === "thumbnail") {
      productForm.value.thumbnailUrls ||= [];
      productForm.value.thumbnailUrls.push(urls[i]!);
    }

    if (task.type === "option") {
      task.ref.imageUrl = urls[i];
    }

    i++;
  });
};

// Đưa ảnh đại diện lên đầu mảng imageUrls (quy ước imageUrls[0] = ảnh đại diện)
const moveFeaturedImageToFront = (
  featuredKey: string,
  preUploadUrlCount: number,
  featuredFileIndex: number,
) => {
  if (!featuredKey) return;
  const imageUrls = productForm.value.imageUrls || [];

  // Xác định url của ảnh đại diện sau khi đã upload xong
  let featuredUrl = "";
  if (featuredFileIndex >= 0) {
    // Ảnh đại diện là file mới: url mới được thêm vào sau các url cũ, theo thứ tự file
    featuredUrl = imageUrls[preUploadUrlCount + featuredFileIndex] || "";
  } else if (imageUrls.includes(featuredKey)) {
    // Ảnh đại diện là ảnh đã tải lên từ trước
    featuredUrl = featuredKey;
  }

  if (!featuredUrl || imageUrls[0] === featuredUrl) return;
  productForm.value.imageUrls = [featuredUrl, ...imageUrls.filter((url) => url !== featuredUrl)];
};

const deleteOptionValue = (index: number) => {
  if (productForm.value.optionValues?.length === 1) {
    return;
  }
  productForm.value.optionValues?.splice(index, 1);
};

const removeProductOptionValue = (optionIndex: number) => {
  if (optionIndex < 0 || optionIndex >= productOptionValues.value.length) return;
  if (productOptionValues.value.length <= 1) return;
  productOptionValues.value.splice(optionIndex, 1);

  // Keep index alignment between productOptions and optionValues.productOptionNames
  productForm.value.optionValues = (productForm.value.optionValues || []).map((optionValue) => {
    const nextOptionNames = [...(optionValue.productOptionNames || [])];
    nextOptionNames.splice(optionIndex, 1);
    return {
      ...optionValue,
      productOptionNames: nextOptionNames,
    };
  });

  syncVariantOptionsToForm();
};

const toggleOptionValue = (rowIndex: number, optionIndex: number, optionValue: string) => {
  const row = productForm.value.optionValues?.[rowIndex];
  if (!row || !isEdit.value) return;

  const nextOptionNames = [...(row.productOptionNames || [])];
  nextOptionNames[optionIndex] = nextOptionNames[optionIndex] === optionValue ? "" : optionValue;
  row.productOptionNames = nextOptionNames;

  if (formError.value?.optionValues?.[rowIndex]?.productOptionNames) {
    formError.value.optionValues[rowIndex].productOptionNames = [];
  }
};

const isOptionPicked = (rowIndex: number, optionIndex: number, optionValue: string) => {
  return (
    productForm.value.optionValues?.[rowIndex]?.productOptionNames?.[optionIndex] === optionValue
  );
};

const getOptionValueError = (rowIndex: number) => {
  const error = formError.value?.optionValues?.[rowIndex]?.productOptionNames;
  if (Array.isArray(error)) {
    return error.filter(Boolean).join(", ");
  }
  return "";
};

// * CHỌN ẢNH TỪ ẢNH SẢN PHẨM (thumbnail + ảnh biến thể)
// Mở popup hiện các ảnh đã có của SP để chọn, kèm nút tải ảnh mới lên.
const imageFromProductPickerRef = ref<{
  open: (opts: { urls?: string[]; files?: File[] }) => Promise<{ url?: string; file?: File } | null>;
}>();

const openImageFromProduct = (): Promise<{ url?: string; file?: File } | null> => {
  if (!imageFromProductPickerRef.value) return Promise.resolve(null);
  return imageFromProductPickerRef.value.open({
    urls: productForm.value.imageUrls || [],
    files: productForm.value.imageFiles || [],
  });
};

const openThumbnailPicker = async () => {
  if (!isEdit.value) return;
  const res = await openImageFromProduct();
  if (!res) return;
  if (res.url) {
    productForm.value.thumbnailUrls = [res.url];
    productForm.value.thumbnailFiles = [];
  } else if (res.file) {
    productForm.value.thumbnailFiles = [res.file];
    productForm.value.thumbnailUrls = [];
  }
};

const openVariantImagePicker = async (index: number) => {
  if (!isEdit.value) return;
  const option = productForm.value.optionValues?.[index];
  if (!option) return;
  const res = await openImageFromProduct();
  if (!res) return;
  if (res.url) {
    option.imageUrl = res.url;
    option.imageFile = [];
  } else if (res.file) {
    option.imageFile = [res.file];
  }
};

// * CẮT ẢNH (đại diện + thumbnail) — cả hai đều hiển thị 4:5 ngoài shop
const CROP_ASPECT_RATIO = 4 / 5;
const imageCropModalRef = ref<{
  open: (source: File | string, options?: { aspectRatio?: number }) => Promise<File | null>;
}>();

const openFeaturedCrop = async () => {
  if (!isEdit.value || !imageCropModalRef.value) return;
  const key = effectiveFeaturedKey.value;
  if (!key) return;

  const isExistingUrl = (productForm.value.imageUrls || []).includes(key);
  const source: File | string | undefined = isExistingUrl
    ? key
    : (productForm.value.imageFiles || []).find((file) => getFileKey(file) === key);
  if (!source) return;

  const cropped = await imageCropModalRef.value.open(source, { aspectRatio: CROP_ASPECT_RATIO });
  if (!cropped) return;

  if (isExistingUrl) {
    // Bỏ url cũ, thay bằng file đã cắt (sẽ upload khi bấm lưu)
    productForm.value.imageUrls = (productForm.value.imageUrls || []).filter((url) => url !== key);
    productForm.value.imageFiles = [...(productForm.value.imageFiles || []), cropped];
  } else {
    productForm.value.imageFiles = (productForm.value.imageFiles || []).map((file) =>
      getFileKey(file) === key ? cropped : file,
    );
  }
  featuredImageKey.value = getFileKey(cropped);
};

const openThumbnailCrop = async (index: number) => {
  if (!isEdit.value || !imageCropModalRef.value) return;

  const existingCount = (productForm.value.thumbnailUrls || []).length;
  const isExistingUrl = index < existingCount;
  const source: File | string | undefined = isExistingUrl
    ? productForm.value.thumbnailUrls?.[index]
    : productForm.value.thumbnailFiles?.[index - existingCount];
  if (!source) return;

  const cropped = await imageCropModalRef.value.open(source, { aspectRatio: CROP_ASPECT_RATIO });
  if (!cropped) return;

  if (isExistingUrl) {
    productForm.value.thumbnailUrls?.splice(index, 1);
  }
  productForm.value.thumbnailFiles = [cropped];
};

const removeThumbnail = (index: number) => {
  const existingCount = (productForm.value.thumbnailUrls || []).length;
  if (index < existingCount) {
    productForm.value.thumbnailUrls?.splice(index, 1);
    return;
  }
  const fileIndex = index - existingCount;
  productForm.value.thumbnailFiles?.splice(fileIndex, 1);
};

const duplicateOptionValue = (index: number) => {
  const currentValue = productForm.value.optionValues?.[index];
  if (!currentValue || !productForm.value.optionValues) return;
  productForm.value.optionValues.splice(index + 1, 0, {
    ...currentValue,
    _id: undefined,
    code: "",
    imageFile: [],
    productOptionNames: [...(currentValue.productOptionNames || [])],
  });
};

watchEffect(() => {
  if (defaultData) {
    console.log(defaultData);
    productForm.value = {
      ...defaultData,
      categoryIds: defaultData?.categoryIds || [],
      similarProductIds: defaultData?.similarProductIds || [],
      productOptions: defaultData?.productOptions || [],
      comboTiers: (defaultData?.comboTiers || []).map((tier) => ({ ...tier })),
      imageUrls: defaultData?.imageUrls || [],
      thumbnailUrls: defaultData?.thumbnailUrls || [],
      imageFiles: [],
      thumbnailFiles: [],
      optionValues: (defaultData?.optionValues || [createDefaultOptionValue()]).map((option) => ({
        ...option,
        imageFile: [],
      })),
    };
    // Ảnh đầu tiên hiện tại chính là ảnh đại diện (quy ước imageUrls[0])
    featuredImageKey.value = defaultData?.imageUrls?.[0] || "";
    productOptionValues.value = buildVariantOptionValues(defaultData);
  } else {
    productForm.value = {
      categoryIds: [],
      tagIds: [],
      similarProductIds: [],
      productOptions: [],
      comboTiers: [],
      imageUrls: [],
      thumbnailUrls: [],
      imageFiles: [],
      thumbnailFiles: [],
      descriptionFrameId: null,
      optionValues: [createDefaultOptionValue()],
    };
    featuredImageKey.value = "";
    productOptionValues.value = [createOptionDef()];
  }

  // Mở sản phẩm nào cũng cho sửa ngay (khỏi bấm "Chỉnh sửa").
  // Vẫn giữ nút chuyển sang xem ở footer nếu cần.
  isEdit.value = true;

  // Reset trạng thái kiểm tra slug mỗi lần mở modal
  slugTouched.value = Boolean(defaultData?._id); // SP cũ: coi như đã có slug tay
  slugAvailable.value = null;
  slugChecking.value = false;

  formError.value = {};
});

watch(
  () => productForm.value.thumbnailFiles,
  (files) => {
    thumbnailPreviewUrls.value.forEach((url) => URL.revokeObjectURL(url));
    thumbnailPreviewUrls.value = (files || []).map((file) => URL.createObjectURL(file));
  },
  { deep: true },
);

// Tạo URL xem trước cho ảnh đại diện khi nó là file mới chưa upload
const revokeFeaturedFilePreview = () => {
  if (featuredFilePreviewUrl.value) {
    URL.revokeObjectURL(featuredFilePreviewUrl.value);
    featuredFilePreviewUrl.value = "";
  }
};

watch(
  [effectiveFeaturedKey, () => productForm.value.imageFiles],
  () => {
    revokeFeaturedFilePreview();
    const key = effectiveFeaturedKey.value;
    if (!key || (productForm.value.imageUrls || []).includes(key)) return;
    const file = (productForm.value.imageFiles || []).find((item) => getFileKey(item) === key);
    if (file) featuredFilePreviewUrl.value = URL.createObjectURL(file);
  },
  { deep: true },
);

onMounted(async () => {
  fetchProductsForPicker();
  activeDescriptionFrames.value = await fetchActiveFrames();
});

onBeforeUnmount(() => {
  thumbnailPreviewUrls.value.forEach((url) => URL.revokeObjectURL(url));
  revokeFeaturedFilePreview();
  if (slugCheckTimer) clearTimeout(slugCheckTimer);
});

defineExpose({
  openModal: () => modalRef.value?.openModal(),
});
</script>

<style scoped lang="scss">
.vcu-product-modal {
  table {
    td {
      vertical-align: middle;
    }
  }
}

.section-title {
  font-family: "Noto Serif", serif;
  border-left: 4px solid #8b0000;
  color: #5f0f0c;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
  padding-left: 12px;
}

.vcu-product-modal :deep(.space-y-1 > p.font-medium) {
  color: #5f514f;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
</style>
