<template>
  <div class="space-y-5">
    <!-- BƯỚC 1: CHỌN COMBO (bấm để chọn bậc) -->
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <span class="h-5 w-5 center-child rounded-full bg-primary text-white text-xs font-bold">1</span>
        <label class="text-base font-bold text-on-surface sm:text-lg">
          Chọn combo
          <span class="text-on-surface-variant font-normal text-sm">— càng nhiều càng rẻ</span>
        </label>
      </div>
      <div class="space-y-2">
        <button
          v-for="(tier, ti) in tiers"
          :key="ti"
          type="button"
          class="w-full flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer"
          :class="
            ti === selectedIndex
              ? 'border-primary ring-1 ring-primary bg-primary/5'
              : 'border-outline-variant bg-white hover:border-primary/50'
          "
          @click="selectTier(ti)"
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
              {{ formatPrice(Math.round(tier.price / Math.max(1, tier.quantity))) }}/sản phẩm
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
        </button>
      </div>
    </div>

    <!-- BƯỚC 2: CHỌN MÀU — bấm ô màu để +1, hoặc dùng +/− -->
    <div v-if="colors.length" class="space-y-3">
      <div class="flex items-center gap-2">
        <span class="h-5 w-5 center-child rounded-full bg-primary text-white text-xs font-bold">2</span>
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

      <p v-if="pickedTotal < needQty" class="text-xs text-on-surface-variant">
        Bấm vào màu để chọn (mỗi màu 1 cái) — cần thêm {{ needQty - pickedTotal }} sản phẩm.
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

    <!-- TỔNG KẾT + CTA — ghim ở đáy popup, 2 nút cùng 1 hàng -->
    <div
      class="sticky bottom-0 z-10 -mx-3 mt-1 space-y-2 border-t border-outline-variant/40 bg-white px-3 py-3 shadow-[0_-4px_14px_rgba(0,0,0,0.07)] lg:(-mx-4 px-4)"
    >
      <div class="flex items-center justify-between">
        <span class="text-sm text-on-surface-variant">Tổng cộng</span>
        <div class="text-right leading-tight">
          <span class="text-2xl font-bold text-primary">{{ formatPrice(selectedTier?.price || 0) }}</span>
          <span v-if="selectedTier?.freeship" class="ml-1 text-xs font-semibold text-success">Freeship</span>
        </div>
      </div>

      <p v-if="validateMsg" class="text-xs text-danger">{{ validateMsg }}</p>

      <div class="flex items-stretch gap-2 font-bold">
        <AtomsButton
          type="secondary"
          class="!px-4 shrink-0 disabled:(opacity-50 cursor-not-allowed)"
          aria-label="Thêm vào giỏ"
          :is-loading="loadingStates.addToCart"
          @click="handleAddToCart"
        >
          <ShoppingBag class="size-5" />
        </AtomsButton>
        <AtomsButton
          type="primaryGradient"
          class="flex-1 h-unset !py-4 text-base disabled:(opacity-50 cursor-not-allowed)"
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

// Combo đang chọn (bấm để chọn); mặc định bậc đầu tiên
const selectedIndex = ref(0);
const selectedTier = computed<TComboTier | null>(() => tiers.value[selectedIndex.value] ?? null);
const needQty = computed(() => Math.max(1, selectedTier.value?.quantity ?? 1));

const colorQty = ref<Record<string, number>>({});
const selectedSize = ref<string | null>(null);
const validateMsg = ref("");
const loadingStates = computed(
  () => usePurchaseOrderStore().loadingStates.value ?? { addToCart: false },
);

const selectTier = (index: number) => {
  selectedIndex.value = index;
  colorQty.value = {}; // đổi combo -> chọn lại màu cho đúng số lượng
  validateMsg.value = "";
};

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

const canInc = (color: string | null): boolean => {
  if (pickedTotal.value >= needQty.value) return false;
  return (colorQty.value[color || ""] || 0) < colorMax(color);
};

// Bấm ô màu: 0 -> 1; đang >0 -> 0 (bỏ chọn)
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

const unitOptionValues = computed<(TOptionValue | undefined)[]>(() => {
  const units: (TOptionValue | undefined)[] = [];
  for (const [color, qty] of Object.entries(colorQty.value)) {
    const c = color === "" ? null : color;
    for (let i = 0; i < (qty || 0); i++) units.push(findVariant(c, selectedSize.value));
  }
  return units;
});

const isComplete = computed(() => {
  if (!selectedTier.value) return false;
  if (pickedTotal.value !== needQty.value) return false;
  if (hasSizeDim.value && !selectedSize.value) return false;
  return unitOptionValues.value.length === needQty.value && unitOptionValues.value.every((o) => !!o);
});

const buildValidateMsg = () => {
  if (!selectedTier.value) return "Vui lòng chọn combo.";
  if (pickedTotal.value !== needQty.value)
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
      quantity: needQty.value,
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
