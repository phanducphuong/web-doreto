import {
  IsInt,
  IsNumber,
  Min,
  Max,
  IsUUID,
  IsOptional,
  IsString,
} from 'class-validator';

export class PurchaseItemDto {
  @IsUUID()
  productOptionValueId: string;

  @IsUUID()
  productId: string;

  // Số nguyên, có trần — chặn count=1.5 (lỗi Prisma 500) và count khổng lồ gây
  // tràn Int32 khi cộng dồn purchaseCount / thổi phồng doanh thu.
  @IsInt()
  @Min(1)
  @Max(1000)
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
  @IsInt()
  @Min(1)
  @Max(1000)
  comboQuantity?: number;

  // Nhãn hiển thị của combo (chỉ để lưu snapshot cho hiển thị)
  @IsOptional()
  @IsString()
  comboLabel?: string;
}
