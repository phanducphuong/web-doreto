import type { TExistedProduct, TOptionValue } from "~/types/product.type";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export const normalizeText = (text: string = ""): string => {
  let str = text.toLowerCase();
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  str = str.replace(/[đĐ]/g, "d");
  str = str.replace(/ {2}/g, " ");
  return str;
};

export const generateSlug = (text: string = ""): string => {
  return normalizeText(text).trim().replace(/ /g, "-");
};

export const isNumber = (value: any): boolean => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

export const parseNumber = (val: any, defaultVal?: number) => {
  const n = Number(val);
  return isNaN(n) ? defaultVal : n;
};

const parsePriceNumber = (price: string | number): number | null => {
  if (price === null || price === undefined || price === "") return null;
  const numeric = typeof price === "number" ? price : Number(String(price).replace(/[^\d]/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
};

const formatCompactAmount = (value: number): string => {
  if (value >= 1_000_000) {
    const tr = value / 1_000_000;
    const text = Number.isInteger(tr) ? String(tr) : tr.toFixed(1).replace(".", ",");
    return `${text}tr`;
  }
  if (value >= 1_000) {
    const k = value / 1_000;
    const text = Number.isInteger(k) ? String(k) : k.toFixed(1).replace(".", ",");
    return `${text}k`;
  }
  return value.toLocaleString("vi-VN", { minimumFractionDigits: 0 }).replace(/,/g, ".");
};

export const formatPrice = (price: string | number): string => {
  const numeric = parsePriceNumber(price);
  if (numeric === null) return "";
  return numeric.toLocaleString("vi-VN", { minimumFractionDigits: 0 }).replace(/,/g, ".") + "đ";
};

/** Rút gọn giá cho card nhỏ: 300.000 → 300k, 1.200.000 → 1,2tr */
export const formatPriceCompact = (price: string | number): string => {
  const numeric = parsePriceNumber(price);
  if (numeric === null) return "";
  const compact = formatCompactAmount(numeric);
  return compact.endsWith("k") || compact.endsWith("tr") ? compact : `${compact}đ`;
};

export const parsePrice = (value: string): number => {
  if (!value) return 0;
  const numeric = value.replace(/[^\d]/g, ""); // remove tất cả ký tự không phải số
  return Number(numeric) || 0;
};

export const hasError = (obj: any): boolean => {
  if (!obj) return false;

  if (typeof obj === "string") {
    return obj.trim() !== "";
  }

  if (Array.isArray(obj)) {
    return obj.some((item) => hasError(item));
  }

  if (typeof obj === "object") {
    return Object.values(obj).some((value) => hasError(value));
  }

  return false;
};

export const getSafeNumber = (value: any, defaultValue: number = 0): number => {
  const n = Number(value);
  return isNaN(n) ? defaultValue : n;
};

export const getProductPriceData = (
  product: TExistedProduct,
  existedOptionValues?: TOptionValue[],
) => {
  const options = existedOptionValues || product.optionValues;

  if (!options?.length) {
    return {
      minPrice: 0,
      maxPrice: 0,
      maxDiscountPercent: 0,
      originalPrice: undefined,
      optionDiscountPercents: [],
      stockCount: 0,
    };
  }

  const optionDiscountPercents = options.map((option) => {
    const originalPrice = option.originalPrice ?? option.price;
    return Math.max(0, ((originalPrice - option.price) / originalPrice) * 100);
  });

  const maxDiscountPercent = Math.max(...optionDiscountPercents);

  const { minPrice, maxPrice, stockCount } = options.reduce(
    (acc, option) => {
      return {
        minPrice: Math.min(acc.minPrice, option.price),
        maxPrice: Math.max(acc.maxPrice, option.price),
        stockCount: acc.stockCount + (option.stock ?? 0),
      };
    },
    { minPrice: Infinity, maxPrice: 0, stockCount: 0 },
  );

  const resolvedMinPrice = isFinite(minPrice) ? minPrice : 0;
  const cheapestOption = options.reduce((best, option) => {
    if (option.price < best.price) return option;
    if (option.price === best.price) {
      const bestOriginal = best.originalPrice ?? 0;
      const optionOriginal = option.originalPrice ?? 0;
      if (optionOriginal > bestOriginal) return option;
    }
    return best;
  }, options[0]);

  const originalPrice =
    cheapestOption?.originalPrice && cheapestOption.originalPrice > cheapestOption.price
      ? cheapestOption.originalPrice
      : undefined;

  return {
    minPrice: resolvedMinPrice,
    maxPrice: getSafeNumber(maxPrice),
    maxDiscountPercent: Math.round(Math.max(0, maxDiscountPercent)),
    originalPrice,
    optionDiscountPercents,
    stockCount: getSafeNumber(stockCount),
  };
};

export const formatIsoDateTime = (isoString: string): string => {
  if (!isoString) return "";

  const parsedDate = dayjs(isoString);
  if (!parsedDate.isValid()) return "";

  return parsedDate.tz("Asia/Ho_Chi_Minh").format("HH:mm DD/MM/YYYY");
};
