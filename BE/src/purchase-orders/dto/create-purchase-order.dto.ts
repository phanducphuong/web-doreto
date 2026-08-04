import { IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseItemDto } from './purchase-item.dto';
import { AddressDto } from 'src/users/dto/address.dto';
import { NonLoginUserDto } from 'src/users/dto/non-login-user.dto';
import { PurchaseOrderStatus } from 'src/common/enums/purchase-order.enum';

export class CreatePurchaseOrderDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  purchaseItems: PurchaseItemDto[];

  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  address?: AddressDto;

  @ValidateNested()
  @Type(() => NonLoginUserDto)
  @IsOptional()
  nonLoginUser?: NonLoginUserDto;

  @IsOptional()
  @IsString()
  status?: PurchaseOrderStatus;
}
