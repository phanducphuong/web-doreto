export function normalizeText(str: string): string {
  return str
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // xóa dấu
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/**
 * Sinh slug SEO sạch từ một chuỗi (thường là tên sản phẩm).
 * Bỏ dấu, đưa về chữ thường, chỉ giữ [a-z0-9], khoảng trắng -> "-",
 * gộp nhiều "-" liền nhau, cắt "-" ở đầu/cuối. KHÔNG kèm id.
 * VD: "Đèn Trang Trí   Cao Cấp!!" -> "den-trang-tri-cao-cap".
 */
export function generateSlug(input: string): string {
  return normalizeText(input ?? '')
    .replace(/[^a-z0-9\s-]/g, '') // bỏ ký tự đặc biệt
    .trim()
    .replace(/\s+/g, '-') // khoảng trắng -> gạch nối
    .replace(/-+/g, '-') // gộp nhiều gạch nối
    .replace(/^-+|-+$/g, ''); // bỏ gạch nối đầu/cuối
}
