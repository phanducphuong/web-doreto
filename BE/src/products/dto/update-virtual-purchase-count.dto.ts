import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateVirtualPurchaseCountDto {
  // Lượt mua ảo do admin chỉnh tay (chỉ để hiển thị trên web)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  virtualPurchaseCount: number;
}
