import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class AddressDto {
  @IsOptional()
  @IsString()
  addressName?: string; // Tên gợi nhớ địa chỉ (vd "Nhà riêng")

  @IsString()
  name: string; // Tên người nhận

  @IsString()
  detailedAddress: string; // Địa chỉ cụ thể

  @IsString()
  ward: string; // Phường/Xã

  @IsString()
  district: string; // Quận/Huyện

  @IsString()
  city: string; // Thành phố/Tỉnh

  @IsOptional()
  @IsString()
  country?: string; // Quốc gia (tùy chọn)

  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
