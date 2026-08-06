import {
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PurchaseItemDto } from './purchase-item.dto';
import { OrderAddressDto } from './order-address.dto';
import { NonLoginUserDto } from 'src/users/dto/non-login-user.dto';
import { PurchaseOrderStatus } from 'src/common/enums/purchase-order.enum';
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

export class CreatePurchaseOrderDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  purchaseItems: PurchaseItemDto[];

  @ValidateNested()
  @Type(() => OrderAddressDto)
  @IsOptional()
  address?: OrderAddressDto;

  @ValidateNested()
  @Type(() => NonLoginUserDto)
  @IsOptional()
  nonLoginUser?: NonLoginUserDto;

  @IsOptional()
  @IsString()
  status?: PurchaseOrderStatus;

  // Snapshot attribution first-touch từ FE. Lưu nguyên văn (D-03) — khớp CRM là phase 38.
  // Optional: thiếu field vẫn tạo đơn bình thường, không đụng luật tiền/kho/quyền (D-07).
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
