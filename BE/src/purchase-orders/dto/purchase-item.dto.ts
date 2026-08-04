import { IsNumber, Min, IsUUID } from 'class-validator';

export class PurchaseItemDto {
  @IsUUID()
  productOptionValueId: string;

  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(1)
  count: number;

  @IsNumber()
  @Min(0)
  price: number;
}
