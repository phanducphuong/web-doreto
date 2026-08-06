// Proxy tải ảnh gốc phục vụ CẮT ẢNH trong admin.
//
// Vì sao cần: trình cắt ảnh (cropperjs) phải đọc dữ liệu pixel để xuất file, nên
// ảnh phải tải được ở dạng "cùng nguồn gốc" (same-origin). Ảnh sản phẩm nằm trên
// CDN khác origin (cdn.dorreto.com); fetch thẳng từ trình
// duyệt phụ thuộc vào việc origin trang admin có nằm trong whitelist CORS của CDN
// hay không — hễ mở admin từ origin lạ là fetch fail và popup crop "nháy rồi mất".
// Tải qua route này (cùng origin với app) thì không bao giờ dính CORS, và canvas
// cắt ảnh không bị "nhiễm" (tainted) nên luôn xuất được file.
//
// Chặn SSRF: chỉ cho phép đúng các host ảnh của mình.
const ALLOWED_HOSTS = new Set(["cdn.dorreto.com"]);

export default defineEventHandler(async (event) => {
  const { url } = getQuery(event);
  if (typeof url !== "string" || !url) {
    throw createError({ statusCode: 400, statusMessage: "Thiếu tham số url" });
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    throw createError({ statusCode: 400, statusMessage: "URL không hợp lệ" });
  }

  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.host)) {
    throw createError({ statusCode: 400, statusMessage: "Nguồn ảnh không được phép" });
  }

  const upstream = await fetch(target.toString());
  if (!upstream.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `Không tải được ảnh (${upstream.status})`,
    });
  }

  const contentType = upstream.headers.get("content-type") || "application/octet-stream";
  if (!contentType.startsWith("image/")) {
    throw createError({ statusCode: 415, statusMessage: "Nội dung không phải ảnh" });
  }

  setResponseHeader(event, "content-type", contentType);
  // Cache riêng phía trình duyệt admin, ngắn — chỉ phục vụ thao tác cắt ảnh
  setResponseHeader(event, "cache-control", "private, max-age=300");

  return Buffer.from(await upstream.arrayBuffer());
});
