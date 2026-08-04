import { IsString, IsNumber, Min, IsMongoId } from 'class-validator';

export class PurchaseItemDto {
  @IsString()
  @IsMongoId()
  productOptionValueId: string;

  @IsNumber()
  productId: string;

  @IsNumber()
  @Min(1)
  count: number;

  @IsNumber()
  @Min(0)
  price: number;
}
