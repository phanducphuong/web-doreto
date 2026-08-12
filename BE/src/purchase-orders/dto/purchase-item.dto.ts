import { IsNumber, Min, IsUUID, IsOptional, IsString } from 'class-validator';

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

  // ==== Combo (tùy chọn) ====
  // Các dòng cùng comboGroupId tạo thành 1 gói combo; giá gói do BE tự áp từ
  // Product.comboTiers theo comboQuantity (KHÔNG tin giá client). Mỗi dòng combo
  // phải count=1 (1 dòng = 1 sản phẩm trong gói) để chia giá chính xác.
  @IsOptional()
  @IsString()
  comboGroupId?: string;

  // Số lượng sản phẩm của bậc combo (khớp với tier.quantity trong comboTiers)
  @IsOptional()
  @IsNumber()
  @Min(1)
  comboQuantity?: number;

  // Nhãn hiển thị của combo (chỉ để lưu snapshot cho hiển thị)
  @IsOptional()
  @IsString()
  comboLabel?: string;
}
