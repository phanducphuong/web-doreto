import { hasProtocol, joinURL, parseURL } from "ufo";
import { createOperationsGenerator, defineProvider } from "@nuxt/image/runtime";

// Sinh phần tham số cho Cloudflare Image Transformations, ví dụ:
//   width=294,format=webp,fit=cover,quality=80
const operationsGenerator = createOperationsGenerator({
  keyMap: {
    width: "width",
    height: "height",
    dpr: "dpr",
    fit: "fit",
    gravity: "gravity",
    quality: "quality",
    format: "format",
    sharpen: "sharpen",
  },
  valueMap: {
    fit: {
      cover: "cover",
      contain: "contain",
      fill: "scale-down",
      outside: "crop",
      inside: "pad",
    },
  },
  joinWith: ",",
  formatter: (key, value) => `${key}=${value}`,
});

/**
 * Provider tạo link ảnh qua Cloudflare Image Transformations (/cdn-cgi/image/).
 * Cloudflare resize + nén ảnh ngay tại biên (edge) rồi cache ở đó, nên server
 * Cloud Run KHÔNG còn phải tải + resize ảnh nữa (bỏ hẳn đường _ipx). Nhờ vậy
 * hết luôn cả 3 tầng lỗi cũ: IPv6, hết RAM khi resize, và cache lỗi 500.
 *
 * Quy tắc:
 *  - Ảnh trên CDN của mình (cdn.dorreto.com) → đổi sang link cdn-cgi với
 *    đường dẫn tương đối (cùng zone → không cần bật "cho phép nguồn ngoài").
 *  - Ảnh ở nơi khác hoặc đường dẫn nội bộ → GIỮ NGUYÊN, không đụng.
 */
export default defineProvider({
  getImage(
    src: string,
    { modifiers = {}, baseURL = "https://cdn.dorreto.com" }: any,
  ) {
    const cdnHost = parseURL(baseURL).host;

    // Chỉ tối ưu ảnh có URL đầy đủ trỏ đúng CDN của mình.
    if (!hasProtocol(src) || parseURL(src).host !== cdnHost) {
      return { url: src };
    }

    const path = parseURL(src).pathname; // -> /doreto/images/xxx.webp

    // format=auto: Cloudflare tự chọn định dạng nhẹ nhất mà trình duyệt hỗ trợ
    // (AVIF cho máy mới ~ nhẹ hơn webp, tự lùi về jpeg cho máy cũ). Ảnh sản phẩm
    // đều là ảnh chụp nên auto luôn phù hợp.
    const operations = operationsGenerator({ ...modifiers, format: "auto" });
    const url = operations
      ? joinURL(baseURL, "cdn-cgi/image", operations, path)
      : joinURL(baseURL, path);

    return { url };
  },
});
