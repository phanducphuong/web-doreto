export function getApiErrorMessage(error: unknown, fallback = "Có lỗi xảy ra"): string {
  if (typeof error !== "object" || error === null) return fallback;

  const err = error as Record<string, unknown>;
  const data = err.data as Record<string, unknown> | undefined;

  if (data && typeof data.message === "string" && data.message.trim()) {
    return data.message.trim();
  }

  if (typeof err.message === "string" && err.message.trim()) {
    const msg = err.message.trim();
    if (!msg.startsWith("[GET]") && !msg.startsWith("[POST]") && !msg.startsWith("[PATCH]")) {
      return msg;
    }
  }

  return fallback;
}
