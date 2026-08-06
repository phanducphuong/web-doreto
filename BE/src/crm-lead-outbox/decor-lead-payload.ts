import { Prisma } from '@prisma/client';

/**
 * Builder payload lead decor → CRM (khớp CreateDecorLeadDto plan 02).
 *
 * Hàm THUẦN (không I/O, không throw) — chỉ đọc snapshot đã có trên đơn/liên hệ,
 * dựng object đúng hợp đồng webhook CRM. Field lạ ngoài hợp đồng bị CRM
 * ValidationPipe whitelist loại bỏ, nên chỉ set field đã biết.
 *
 * Mapping ↔ decision:
 * - line 'THOI_TRANG' → CRM đa-web: gán đúng line + validate mã SP theo bảng thời trang
 *   + khóa idempotency 'THOI_TRANG:kind:id' (KHÔNG trùng đơn web decor cùng sourceId).
 *   BẮT BUỘC gửi — thiếu thì CRM mặc định TUONG → lead sai line + nguy cơ mất lead.
 * - sourceKind 'order' | 'contact' → CRM đặt campaignName 'Decor-Đơn' / 'Decor-Liên hệ' (D-03)
 * - productCodes = TẤT CẢ mã biến thể (OptionValue.code) của các dòng đơn, bỏ null/rỗng (D-06/D-07)
 * - summaryPriceVnd = summaryPrice đơn → CRM expectedRevenueVnd (D-10); liên hệ KHÔNG có
 * - visitorId / camp / utm: nguyên văn từ cột phase 37 (D-09)
 */

/** Line nghiệp vụ web này (web thời trang) — CRM đa-web nhận qua CreateDecorLeadDto.line. */
const LEAD_LINE = 'THOI_TRANG';

/** Snapshot biến thể lưu trên PurchaseItem.productOptionValue (JSON) — chỉ cần .code. */
interface OrderItemLike {
  productOptionValue?: Prisma.JsonValue;
}

/** Đơn (PurchaseOrder) đã include purchaseItems — nguồn duy nhất dựng payload. */
interface OrderLike {
  id: string;
  address?: Prisma.JsonValue;
  visitorId?: string | null;
  camp?: string | null;
  utm?: Prisma.JsonValue;
  summaryPrice?: number | null;
  purchaseItems?: OrderItemLike[] | null;
}

/** Liên hệ (ContactRequest) đã tạo — attribution lấy từ bản ghi. */
interface ContactLike {
  id: string;
  visitorId?: string | null;
  camp?: string | null;
  utm?: Prisma.JsonValue;
}

/** name/phone của form liên hệ lấy từ DTO submit. */
interface ContactFormLike {
  name?: string;
  phone?: string;
}

/** Snapshot địa chỉ giao lưu trên PurchaseOrder.address (JSON phẳng 3 field). */
interface OrderAddressSnapshot {
  name?: string;
  phoneNumber?: string;
  address?: string;
}

function asAddress(value: Prisma.JsonValue | undefined): OrderAddressSnapshot {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as OrderAddressSnapshot;
  }
  return {};
}

/** utm là object (không phải mảng/scalar) mới đưa vào payload — CRM cần @IsObject. */
function asUtm(value: Prisma.JsonValue | undefined): Prisma.InputJsonValue | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Prisma.InputJsonValue;
  }
  return undefined;
}

/**
 * Payload đơn pending → CRM. Đọc mã SP từ snapshot productOptionValue của từng
 * purchaseItem (khỏi query thêm), bỏ mã null/rỗng (D-06/D-07). Doanh thu = summaryPrice (D-10).
 */
export function buildOrderLeadPayload(order: OrderLike): Prisma.InputJsonValue {
  const addr = asAddress(order.address ?? undefined);

  const productCodes = (order.purchaseItems ?? [])
    .map((it) => {
      const ov = it.productOptionValue as { code?: string | null } | null;
      return ov?.code ?? null;
    })
    .filter((c): c is string => typeof c === 'string' && c.trim().length > 0);

  const payload: Record<string, unknown> = {
    line: LEAD_LINE,
    sourceKind: 'order',
    sourceId: order.id,
    phone: addr.phoneNumber ?? '',
  };
  if (addr.name) payload.name = addr.name;
  if (addr.address) payload.address = addr.address;
  if (order.visitorId) payload.visitorId = order.visitorId;
  if (order.camp) payload.camp = order.camp;
  const utm = asUtm(order.utm ?? undefined);
  if (utm) payload.utm = utm;
  if (productCodes.length > 0) payload.productCodes = productCodes;
  if (typeof order.summaryPrice === 'number') {
    payload.summaryPriceVnd = order.summaryPrice;
  }

  return payload as Prisma.InputJsonValue;
}

/**
 * Payload form liên hệ → CRM. name/phone lấy từ form; KHÔNG productCodes,
 * KHÔNG summaryPriceVnd (D-10) → CRM để expectedRevenue trống, campaignName 'Decor-Liên hệ' (D-03).
 */
export function buildContactLeadPayload(
  contact: ContactLike,
  form: ContactFormLike,
): Prisma.InputJsonValue {
  const payload: Record<string, unknown> = {
    line: LEAD_LINE,
    sourceKind: 'contact',
    sourceId: contact.id,
    phone: form.phone ?? '',
  };
  if (form.name) payload.name = form.name;
  if (contact.visitorId) payload.visitorId = contact.visitorId;
  if (contact.camp) payload.camp = contact.camp;
  const utm = asUtm(contact.utm ?? undefined);
  if (utm) payload.utm = utm;

  return payload as Prisma.InputJsonValue;
}
