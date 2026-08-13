import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class AddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  addressName?: string; // Tên gợi nhớ địa chỉ (vd "Nhà riêng")

  @IsString()
  @MaxLength(120)
  name: string; // Tên người nhận

  @IsString()
  @MaxLength(300)
  detailedAddress: string; // Địa chỉ cụ thể

  @IsString()
  @MaxLength(120)
  ward: string; // Phường/Xã

  @IsString()
  @MaxLength(120)
  district: string; // Quận/Huyện

  @IsString()
  @MaxLength(120)
  city: string; // Thành phố/Tỉnh

  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string; // Quốc gia (tùy chọn)

  @IsString()
  @MaxLength(20)
  phoneNumber: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
