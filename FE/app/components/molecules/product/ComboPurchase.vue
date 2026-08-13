<template>
  <div class="space-y-5">
    <!-- BƯỚC 1: COMBO (tự xác định theo tổng số đã chọn) -->
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <span class="h-5 w-5 center-child rounded-full bg-primary text-white text-xs font-bold">1</span>
        <label class="text-base font-bold text-on-surface sm:text-lg">
          Chọn combo
          <span class="text-on-surface-variant font-normal text-sm">— càng nhiều càng rẻ</span>
        </label>
      </div>
      <div class="space-y-2">
        <div
          v-for="tier in tiers"
          :key="tier.quantity"
          class="flex items-center justify-between gap-3 rounded-xl border p-3 transition-all"
          :class="
            tier.quantity === pickedTotal
              ? 'border-primary ring-1 ring-primary bg-primary/5'
              : 'border-outline-variant bg-white'
          "
        >
          <div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-on-surface sm:text-base">
                {{ tier.label || `${tier.quantity} sản phẩm` }}
              </span>
              <span
                v-if="tier.freeship"
                class="rounded bg-success-container/40 px-1.5 py-0.5 text-10px font-semibold text-success"
              >
                Freeship
              </span>
              <span
                v-if="tier.quantity === pickedTotal"
                class="rounded bg-primary/10 px-1.5 py-0.5 text-10px font-semibold text-primary"
              >
                Đang chọn
              </span>
            </div>
            <div class="text-xs text-on-surface-variant">
              {{ formatPrice(Math.round(tier.price / tier.quantity)) }}/sản phẩm
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm font-bold text-primary sm:text-base">{{ formatPrice(tier.price) }}</div>
            <div
              v-if="tier.originalPrice && tier.originalPrice > tier.price"
              class="text-10px text-stone-400 line-through sm:text-xs"
            >
              {{ formatPrice(tier.originalPrice) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- BƯỚC 2: CHỌN MÀU — bấm ô màu để +1, hoặc dùng +/− -->
    <div v-if="colors.length" class="space-y-3">
      <div class="flex items-center gap-2">
        <span class="h-5 w-5 center-child rounded-full bg-primary text-white text-xs font-bold">2</span>
        <label class="text-base font-bold text-on-surface sm:text-lg">Chọn màu</label>
        <span class="ml-auto text-sm font-semibold" :class="activeTier ? 'text-success' : 'text-on-surface-variant'">
          Đã chọn {{ pickedTotal }}
        </span>
      </div>

      <div class="space-y-2">
        <div
          v-for="color in colors"
          :key="color.name || 'default'"
          class="flex items-center gap-3 rounded-xl border p-2 transition-colors"
          :class="
            (colorQty[color.name || ''] || 0) > 0
              ? 'border-primary bg-primary/5'
              : 'border-outline-variant bg-white'
          "
        >
          <!-- Bấm vào ô màu (ảnh + tên) là số lượng tự lên 1 -->
          <button
            type="button"
            class="flex flex-1 items-center gap-3 text-left cursor-pointer disabled:cursor-not-allowed"
            :disabled="(colorQty[color.name || ''] || 0) <= 0 && !canInc(color.name)"
            @click="toggleColor(color.name)"
          >
            <div class="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-surface-container-low">
              <AtomsUiImageWithFallback
                :src="color.imageUrl"
                :alt="color.name || ''"
                :width="120"
                :height="120"
                format="webp"
                loading="lazy"
                img-class="h-full w-full object-cover"
              />
            </div>
            <span class="flex-1 text-sm font-semibold text-on-surface sm:text-base">
              {{ color.name || "Sản phẩm" }}
            </span>
          </button>

          <div class="center-child gap-1 rounded-full border-(2 primary/10) bg-white p-1 leading-none">
            <button
              type="button"
              aria-label="Giảm"
              class="h-7 w-7 center-child cursor-pointer rounded-full bg-transparent text-lg text-stone-500 hover:text-primary disabled:(cursor-not-allowed opacity-30 hover:text-stone-500)"
              :disabled="(colorQty[color.name || ''] || 0) <= 0"
              @click="decColor(color.name)"
            >
              −
            </button>
            <span class="w-7 text-center text-base font-bold text-slate-600">
              {{ colorQty[color.name || ""] || 0 }}
            </span>
            <button
              type="button"
              aria-label="Tăng"
              class="h-7 w-7 center-child cursor-pointer rounded-full bg-transparent text-lg text-stone-500 hover:text-primary disabled:(cursor-not-allowed opacity-30 hover:text-stone-500)"
              :disabled="!canInc(color.name)"
              @click="incColor(color.name)"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <p v-if="!activeTier" class="text-xs text-on-surface-variant">
        {{
          pickedTotal === 0
            ? "Bấm vào màu để chọn (mỗi màu 1 cái) hoặc dùng nút +/−."
            : `Chọn đủ ${tierQtysLabel} sản phẩm để thành combo (đang chọn ${pickedTotal}).`
        }}
      </p>
    </div>

    <!-- BƯỚC 3: CHỌN SIZE (1 lần, dùng chung) -->
    <div v-if="hasSizeDim" class="space-y-3">
      <div class="flex items-center gap-2">
        <span class="h-5 w-5 center-child rounded-full bg-primary text-white text-xs font-bold">3</span>
        <label class="text-base font-bold text-on-surface sm:text-lg">Chọn size</label>
      </div>
      <div class="flex flex-wrap gap-2.5">
        <button
          v-for="size in sizes"
          :key="size"
          type="button"
          :disabled="isSizeDisabled(size)"
          class="rounded-lg px-4 py-1.5 text-base font-semibold transition-all cursor-pointer disabled:(opacity-40 cursor-not-allowed)"
          :class="
            selectedSize === size
              ? 'bg-primary/15 text-primary ring-2 ring-primary'
              : 'bg-surface-container-low text-on-surface-variant ring-1 ring-outline-variant hover:ring-primary/45'
          "
          @click="selectedSize = size"
        >
          {{ size }}
        </button>
      </div>
    </div>

    <!-- TỔNG KẾT + CTA -->
    <div class="space-y-3 rounded-xl bg-surface-container-low p-3 lg:p-4">
      <div class="flex items-center justify-between">
        <span class="text-sm text-on-surface-variant">Tổng cộng</span>
        <div class="text-right">
          <span class="text-2xl font-bold text-primary sm:text-3xl">
            {{ formatPrice(activeTier?.price || 0) }}
          </span>
          <span v-if="activeTier?.freeship" class="ml-2 text-xs font-semibold text-success">Freeship</span>
        </div>
      </div>

      <p v-if="validateMsg" class="text-sm text-danger">{{ validateMsg }}</p>

      <div class="grid grid-cols-1 gap-3 font-bold sm:grid-cols-2">
        <AtomsButton
          type="secondary"
          class="h-unset !py-4 lg:!py-3.5 disabled:(opacity-50 cursor-not-allowed)"
          :is-loading="loadingStates.addToCart"
          @click="handleAddToCart"
        >
          <ShoppingBag class="size-5" />
          Thêm vào giỏ
        </AtomsButton>
        <AtomsButton
          type="primaryGradient"
          class="h-unset !py-4 lg:!py-3.5 disabled:(opacity-50 cursor-not-allowed)"
          @click="handleBuyNow"
        >
          Mua ngay
        </AtomsButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ShoppingBag } from "lucide-vue-next";
import type { TExistedProduct, TOptionValue, TComboTier } from "~/types/product.type";
import { usePurchaseOrderStore } from "~/stores/purchase-order.store";
import { formatPrice } from "~/utils/data.utils";

const props = defineProps<{ product: TExistedProduct }>();

const toast = useToast();
const { addComboToCart, setCartDrawerInitialTab, setCartDrawerOpen } = usePurchaseOrderStore();

const COLOR_RE = /màu|mau sac|color/i;

const tiers = computed<TComboTier[]>(() =>
  [...(props.product.comboTiers || [])].sort((a, b) => a.quantity - b.quantity),
);
const tierQtysLabel = computed(() => tiers.value.map((t) => t.quantity).join(", "));
const maxComboQty = computed(() => tiers.value.reduce((m, t) => Math.max(m, t.quantity), 0));

// Chiều màu / size trong productOptions
const colorDimIndex = computed(() =>
  (props.product.productOptions || []).findIndex((name) => COLOR_RE.test(name)),
);
const sizeDimIndex = computed(() => {
  const options = props.product.productOptions || [];
  return options.findIndex((_, i) => i !== colorDimIndex.value);
});
const hasColorDim = computed(() => colorDimIndex.value >= 0);
const hasSizeDim = computed(() => sizeDimIndex.value >= 0);

const inStockOptions = computed(() =>
  (props.product.optionValues || []).filter((o) => (o.stock ?? 0) > 0),
);

// Danh sách màu (kèm ảnh); không có chiều màu -> 1 mục "Sản phẩm"
const colors = computed<{ name: string | null; imageUrl?: string }[]>(() => {
  if (!hasColorDim.value) return [{ name: null, imageUrl: props.product.thumbnailUrls?.[0] }];
  const names = Array.from(
    new Set(
      (props.product.optionValues || [])
        .map((o) => o.productOptionNames?.[colorDimIndex.value])
        .filter(Boolean) as string[],
    ),
  );
  return names.map((name) => ({
    name,
    imageUrl: (props.product.optionValues || []).find(
      (o) => o.productOptionNames?.[colorDimIndex.value] === name && o.imageUrl,
    )?.imageUrl,
  }));
});

const sizes = computed<string[]>(() => {
  if (!hasSizeDim.value) return [];
  return Array.from(
    new Set(
      (props.product.optionValues || [])
        .map((o) => o.productOptionNames?.[sizeDimIndex.value])
        .filter(Boolean) as string[],
    ),
  );
});

// Số lượng theo màu (key = tên màu; không có màu -> key "")
const colorQty = ref<Record<string, number>>({});
const selectedSize = ref<string | null>(null);
const validateMsg = ref("");
const loadingStates = computed(
  () => usePurchaseOrderStore().loadingStates.value ?? { addToCart: false },
);

const findVariant = (color: string | null, size: string | null): TOptionValue | undefined =>
  inStockOptions.value.find(
    (o) =>
      (colorDimIndex.value < 0 || o.productOptionNames?.[colorDimIndex.value] === color) &&
      (sizeDimIndex.value < 0 || o.productOptionNames?.[sizeDimIndex.value] === size),
  );

const colorMax = (color: string | null): number => {
  if (hasSizeDim.value && selectedSize.value) {
    return findVariant(color, selectedSize.value)?.stock ?? 0;
  }
  return inStockOptions.value
    .filter((o) => colorDimIndex.value < 0 || o.productOptionNames?.[colorDimIndex.value] === color)
    .reduce((sum, o) => sum + (o.stock ?? 0), 0);
};

const pickedTotal = computed(() =>
  Object.values(colorQty.value).reduce((sum, n) => sum + (n || 0), 0),
);

// Combo áp dụng = bậc khớp tổng số đã chọn
const activeTier = computed(() => tiers.value.find((t) => t.quantity === pickedTotal.value) || null);

// Còn tăng được không: chưa vượt combo lớn nhất + còn tồn kho
const canInc = (color: string | null): boolean => {
  if (pickedTotal.value >= maxComboQty.value) return false;
  return (colorQty.value[color || ""] || 0) < colorMax(color);
};

// Bấm vào ô màu: 0 -> 1, đang >0 -> 0 (bỏ chọn)
const toggleColor = (color: string | null) => {
  const key = color || "";
  if ((colorQty.value[key] || 0) > 0) colorQty.value[key] = 0;
  else if (canInc(color)) colorQty.value[key] = 1;
  validateMsg.value = "";
};

const incColor = (color: string | null) => {
  if (!canInc(color)) return;
  const key = color || "";
  colorQty.value[key] = (colorQty.value[key] || 0) + 1;
  validateMsg.value = "";
};

const decColor = (color: string | null) => {
  const key = color || "";
  if ((colorQty.value[key] || 0) <= 0) return;
  colorQty.value[key] = colorQty.value[key] - 1;
};

// Đổi size -> kẹp lại số lượng theo tồn kho size mới
watch(selectedSize, () => {
  for (const key of Object.keys(colorQty.value)) {
    const max = colorMax(key || null);
    if ((colorQty.value[key] || 0) > max) colorQty.value[key] = max;
  }
});

const isSizeDisabled = (size: string) =>
  !inStockOptions.value.some(
    (o) => sizeDimIndex.value < 0 || o.productOptionNames?.[sizeDimIndex.value] === size,
  );

// Mở rộng lựa chọn thành danh sách biến thể cho từng sản phẩm
const unitOptionValues = computed<(TOptionValue | undefined)[]>(() => {
  const units: (TOptionValue | undefined)[] = [];
  for (const [color, qty] of Object.entries(colorQty.value)) {
    const c = color === "" ? null : color;
    for (let i = 0; i < (qty || 0); i++) units.push(findVariant(c, selectedSize.value));
  }
  return units;
});

const isComplete = computed(() => {
  if (!activeTier.value) return false;
  if (hasSizeDim.value && !selectedSize.value) return false;
  return unitOptionValues.value.length > 0 && unitOptionValues.value.every((o) => !!o);
});

const buildValidateMsg = () => {
  if (pickedTotal.value === 0) return "Vui lòng chọn màu (số lượng).";
  if (!activeTier.value)
    return `Cần chọn đủ ${tierQtysLabel.value} sản phẩm để thành combo (đang chọn ${pickedTotal.value}).`;
  if (hasSizeDim.value && !selectedSize.value) return "Vui lòng chọn size.";
  if (unitOptionValues.value.some((o) => !o))
    return "Lựa chọn hiện đã hết hàng, vui lòng đổi màu/size.";
  return "";
};

const commitCombo = async (): Promise<boolean> => {
  validateMsg.value = buildValidateMsg();
  if (!isComplete.value || !activeTier.value) return false;

  const units = unitOptionValues.value.filter(Boolean) as TOptionValue[];
  const res = await addComboToCart(
    props.product,
    {
      quantity: activeTier.value.quantity,
      price: activeTier.value.price,
      label: activeTier.value.label,
      freeship: activeTier.value.freeship,
    },
    units,
  );
  return Boolean(res) || res === undefined;
};

const handleAddToCart = async () => {
  const ok = await commitCombo();
  if (ok) toast.success({ message: "Đã thêm combo vào giỏ hàng" });
};

const handleBuyNow = async () => {
  const ok = await commitCombo();
  if (!ok) return;
  setCartDrawerInitialTab("shipping");
  setCartDrawerOpen(true);
};
</script>
