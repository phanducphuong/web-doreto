import { IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseItemDto } from './purchase-item.dto';
import { AddressDto } from 'src/users/dto/address.dto';
import { NonLoginUserDto } from 'src/users/dto/non-login-user.dto';

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  purchaseItems?: PurchaseItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NonLoginUserDto)
  nonLoginUser?: NonLoginUserDto;

  @IsOptional()
  @IsString()
  status?: string;
}
