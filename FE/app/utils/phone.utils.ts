export const VN_PHONE_INVALID_MESSAGE =
  "Số điện thoại không hợp lệ (10 số, bắt đầu 03/05/07/08/09)";

export const VN_PHONE_REGEX = /^0(3|5|7|8|9)\d{8}$/;

export function normalizeVnPhoneNumber(value: string): string {
  let normalized = value.replace(/[\s.\-()]/g, "");
  if (normalized.startsWith("+84")) {
    normalized = `0${normalized.slice(3)}`;
  } else if (normalized.startsWith("84") && normalized.length === 11) {
    normalized = `0${normalized.slice(2)}`;
  }
  return normalized;
}

export function isValidVnPhoneNumber(value: string): boolean {
  return VN_PHONE_REGEX.test(normalizeVnPhoneNumber(value));
}

export function validateVnPhoneNumber(value: string): string | undefined {
  if (!value || value.trim() === "") {
    return "Số điện thoại là bắt buộc";
  }
  if (!isValidVnPhoneNumber(value)) {
    return VN_PHONE_INVALID_MESSAGE;
  }
  return undefined;
}
