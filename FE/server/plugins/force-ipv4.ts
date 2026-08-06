import dns from "node:dns";

/**
 * Cloud Run KHÔNG có đường IPv6 ra Internet, nhưng CDN (cdn.dorreto.com qua
 * Cloudflare) lại có cả bản ghi IPv6. Khi Node chọn IPv6 để gọi CDN thì kết nối
 * chết ngay → bộ tối ưu ảnh _ipx báo "fetch failed" (HTTP 500).
 *
 * Bản trước dùng setDefaultResultOrder("ipv4first") + setDefaultAutoSelectFamily(false):
 * chạy đúng khi test local (Node 20/22) nhưng trên Cloud Run thực tế VẪN lỗi 100%
 * (revision 00010, 5/8/2026). Vì vậy đổi sang cách không thể trượt: vá thẳng
 * dns.lookup để CHỈ trả về địa chỉ IPv4 (family: 4). net.connect lẫn undici (fetch)
 * đều đọc dns.lookup qua thuộc tính module tại thời điểm gọi, nên bản vá phủ mọi
 * kết nối đi ra. Mọi host mình gọi (Cloudflare CDN, backend *.run.app, Google API)
 * đều có IPv4 nên không mất gì.
 *
 * KHÔNG tắt autoSelectFamily nữa: khi chỉ còn địa chỉ IPv4 thì Happy Eyeballs vô
 * hại, và nếu còn đường code nào lọt qua bản vá thì nó vẫn là lưới đỡ IPv4 cuối.
 */
const origLookup = dns.lookup.bind(dns);
type LookupOptions = Parameters<typeof dns.lookup>[1];
(dns as { lookup: unknown }).lookup = function lookupIPv4Only(
  hostname: string,
  options: LookupOptions | Function,
  callback?: Function,
) {
  if (typeof options === "function") {
    // dns.lookup(hostname, callback)
    return origLookup(hostname, { family: 4 }, options as never);
  }
  const opts =
    typeof options === "number"
      ? { family: 4 }
      : { ...(options as object), family: 4 };
  return origLookup(hostname, opts as never, callback as never);
};

try {
  dns.setDefaultResultOrder("ipv4first");
} catch {}

export default defineNitroPlugin((nitroApp) => {
  // Ảnh _ipx là bất biến theo URL → cache 1 năm + immutable để trình duyệt/CDN
  // không phải tải lại. NHƯNG chỉ cache khi trả về THÀNH CÔNG; lỗi (>=400) thì cấm
  // cache để không "đóng băng" một tấm ảnh lỗi. 304 giữ nguyên header sẵn có —
  // gắn no-store cho 304 sẽ xoá cache trình duyệt đang dùng.
  nitroApp.hooks.hook("beforeResponse", (event) => {
    if (!event.path?.startsWith("/_ipx/")) return;
    const status = getResponseStatus(event);
    if (status >= 200 && status < 300) {
      setResponseHeader(
        event,
        "cache-control",
        "public, max-age=31536000, s-maxage=31536000, immutable",
      );
    } else if (status >= 400) {
      setResponseHeader(event, "cache-control", "no-store");
    }
  });
});
