import {
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PurchaseItemDto } from './purchase-item.dto';
import { OrderAddressDto } from './order-address.dto';
import { NonLoginUserDto } from 'src/users/dto/non-login-user.dto';
import { UtmDto } from 'src/common/dto/utm.dto';

function trimEmptyToUndefined({
  value,
}: {
  value: unknown;
}): string | undefined {
  if (typeof value !== 'string') return undefined;
  const t = value.trim();
  return t === '' ? undefined : t;
}

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  purchaseItems?: PurchaseItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => OrderAddressDto)
  address?: OrderAddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NonLoginUserDto)
  nonLoginUser?: NonLoginUserDto;

  @IsOptional()
  @IsString()
  status?: string;

  // Đơn của user đăng nhập đi đường giỏ CART (POST tạo giỏ) → checkout là PATCH đổi
  // status sang pending; attribution chỉ tới ở bước PATCH này nên update phải nhận 3 field.
  @IsOptional()
  @IsUUID('4')
  visitorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(trimEmptyToUndefined)
  camp?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UtmDto)
  utm?: UtmDto;
}
