import { IsOptional, IsString } from 'class-validator';

// Snapshot địa chỉ giao của đơn hàng — lưu nguyên văn dạng JSON (purchase_orders.address).
// Cố ý TÁCH khỏi AddressDto của sổ địa chỉ user (dạng có cấu trúc ward/district/city):
// FE checkout chỉ gửi 3 field phẳng { name, phoneNumber, address } và admin cũng đọc lại
// đúng 3 field này. Không tái dùng AddressDto để tránh bắt buộc các field không tồn tại.
export class OrderAddressDto {
  // Tên và địa chỉ cho phép thiếu/trống — chỉ SĐT là bắt buộc (validate ở FE).
  @IsOptional()
  @IsString()
  name?: string; // Tên người nhận

  @IsString()
  phoneNumber: string; // Số điện thoại người nhận

  @IsOptional()
  @IsString()
  address?: string; // Địa chỉ giao (một dòng)
}
