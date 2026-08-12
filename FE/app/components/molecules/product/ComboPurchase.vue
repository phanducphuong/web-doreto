<template>
  <div class="space-y-5">
    <!-- BƯỚC 1: CHỌN COMBO -->
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <span
          class="h-5 w-5 center-child rounded-full bg-primary text-white text-xs font-bold"
        >
          1
        </span>
        <label class="text-base font-bold text-on-surface sm:text-lg">Chọn combo</label>
      </div>
      <div class="space-y-2">
        <button
          v-for="tier in tiers"
          :key="tier.quantity"
          type="button"
          class="w-full flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all"
          :class="
            selectedTier?.quantity === tier.quantity
              ? 'border-primary ring-1 ring-primary bg-primary/5'
              : 'border-outline-variant bg-white hover:border-primary/50'
          "
          @click="selectTier(tier)"
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
            </div>
            <div class="text-xs text-on-surface-variant">
              {{ formatPrice(Math.round(tier.price / tier.quantity)) }}/sản phẩm
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm font-bold text-primary sm:text-base">
              {{ formatPrice(tier.price) }}
            </div>
            <div
              v-if="tier.originalPrice && tier.originalPrice > tier.price"
              class="text-10px text-stone-400 line-through sm:text-xs"
            >
              {{ formatPrice(tier.originalPrice) }}
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- BƯỚC 2: CHỌN MÀU + SỐ LƯỢNG TỪNG MÀU (tổng = số quần của combo) -->
    <div v-if="selectedTier && hasColorDim" class="space-y-3">
      <div class="flex items-center gap-2">
        <span
          class="h-5 w-5 center-child rounded-full bg-primary text-white text-xs font-bold"
        >
          2
        </span>
        <label class="text-base font-bold text-on-surface sm:text-lg">Chọn màu</label>
        <span
          class="ml-auto text-sm font-semibold"
          :class="pickedTotal === needQty ? 'text-success' : 'text-on-surface-variant'"
        >
          Đã chọn {{ pickedTotal }}/{{ needQty }}
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
            {{ color.name }}
          </span>
          <div
            class="center-child gap-1 rounded-full border-(2 primary/10) bg-white p-1 leading-none"
          >
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

      <p v-if="pickedTotal < needQty" class="text-xs text-on-surface-variant">
        Chọn thêm {{ needQty - pickedTotal }} sản phẩm nữa để đủ combo.
      </p>
    </div>

    <!-- BƯỚC 3: CHỌN SIZE (1 lần, dùng chung) -->
    <div v-if="selectedTier && hasSizeDim" class="space-y-3">
      <div class="flex items-center gap-2">
        <span
          class="h-5 w-5 center-child rounded-full bg-primary text-white text-xs font-bold"
        >
          {{ hasColorDim ? 3 : 2 }}
        </span>
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
            {{ formatPrice(selectedTier?.price || 0) }}
          </span>
          <span
            v-if="selectedTier?.freeship"
            class="ml-2 text-xs font-semibold text-success"
          >
            Freeship
          </span>
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
const {
  addComboToCart,
  setCartDrawerInitialTab,
  setCartDrawerOpen,
} = usePurchaseOrderStore();

const COLOR_RE = /màu|mau sac|color/i;

const tiers = computed<TComboTier[]>(() =>
  [...(props.product.comboTiers || [])].sort((a, b) => a.quantity - b.quantity),
);

// Xác định chiều màu và chiều size trong productOptions
const colorDimIndex = computed(() =>
  (props.product.productOptions || []).findIndex((name) => COLOR_RE.test(name)),
);
const sizeDimIndex = computed(() => {
  const options = props.product.productOptions || [];
  const idx = options.findIndex((_, i) => i !== colorDimIndex.value);
  return idx;
});
const hasColorDim = computed(() => colorDimIndex.value >= 0);
const hasSizeDim = computed(() => sizeDimIndex.value >= 0);

const inStockOptions = computed(() =>
  (props.product.optionValues || []).filter((o) => (o.stock ?? 0) > 0),
);

// Danh sách màu (kèm ảnh đại diện)
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

// Danh sách size
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

const selectedTier = ref<TComboTier | null>(null);
// Số lượng chọn theo từng màu (key = tên màu). Tổng phải bằng số quần của combo.
const colorQty = ref<Record<string, number>>({});
const selectedSize = ref<string | null>(null);
const validateMsg = ref("");
const loadingStates = computed(
  () => usePurchaseOrderStore().loadingStates.value ?? { addToCart: false },
);

const needQty = computed(() => selectedTier.value?.quantity ?? 0);

const selectTier = (tier: TComboTier) => {
  selectedTier.value = tier;
  colorQty.value = {};
  validateMsg.value = "";
};

// Tìm biến thể (OptionValue) khớp màu + size, còn hàng
const findVariant = (color: string | null, size: string | null): TOptionValue | undefined =>
  inStockOptions.value.find(
    (o) =>
      (colorDimIndex.value < 0 || o.productOptionNames?.[colorDimIndex.value] === color) &&
      (sizeDimIndex.value < 0 || o.productOptionNames?.[sizeDimIndex.value] === size),
  );

// Tồn kho tối đa của 1 màu: theo size đang chọn; chưa chọn size thì lấy tổng còn hàng của màu.
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

const canInc = (color: string | null): boolean => {
  if (pickedTotal.value >= needQty.value) return false;
  return (colorQty.value[color || ""] || 0) < colorMax(color);
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

// Đổi size → kẹp lại số lượng từng màu theo tồn kho của size mới
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

// Mở rộng lựa chọn thành danh sách biến thể cho từng sản phẩm trong combo
const unitOptionValues = computed<(TOptionValue | undefined)[]>(() => {
  if (!selectedTier.value) return [];
  if (!hasColorDim.value) {
    return Array(needQty.value).fill(findVariant(null, selectedSize.value));
  }
  const units: (TOptionValue | undefined)[] = [];
  for (const [color, qty] of Object.entries(colorQty.value)) {
    for (let i = 0; i < (qty || 0); i++) {
      units.push(findVariant(color, selectedSize.value));
    }
  }
  return units;
});

const isComplete = computed(() => {
  if (!selectedTier.value) return false;
  if (hasColorDim.value && pickedTotal.value !== needQty.value) return false;
  if (hasSizeDim.value && !selectedSize.value) return false;
  return (
    unitOptionValues.value.length === needQty.value &&
    unitOptionValues.value.every((o) => !!o)
  );
});

const buildValidateMsg = () => {
  if (!selectedTier.value) return "Vui lòng chọn combo.";
  if (hasColorDim.value && pickedTotal.value !== needQty.value)
    return `Vui lòng chọn đủ ${needQty.value} sản phẩm (đang chọn ${pickedTotal.value}).`;
  if (hasSizeDim.value && !selectedSize.value) return "Vui lòng chọn size.";
  if (unitOptionValues.value.some((o) => !o))
    return "Lựa chọn hiện đã hết hàng, vui lòng đổi màu/size.";
  return "";
};

const commitCombo = async (): Promise<boolean> => {
  validateMsg.value = buildValidateMsg();
  if (!isComplete.value || !selectedTier.value) return false;

  const units = unitOptionValues.value.filter(Boolean) as TOptionValue[];
  const res = await addComboToCart(
    props.product,
    {
      quantity: selectedTier.value.quantity,
      price: selectedTier.value.price,
      label: selectedTier.value.label,
      freeship: selectedTier.value.freeship,
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
