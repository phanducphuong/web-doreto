export function normalizeText(str: string): string {
  return str
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // xóa dấu
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}
