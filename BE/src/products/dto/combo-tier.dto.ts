import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/**
 * Một bậc combo theo TỔNG số lượng sản phẩm (mua N cái với giá gói).
 * Là tầng giá phủ lên trên biến thể màu/size — khách chọn combo (số lượng)
 * rồi chọn màu cho từng cái, size chọn 1 lần.
 */
export class ComboTierDto {
  // Số lượng sản phẩm trong combo (1 = mua lẻ, 2 = combo 2 cái, ...)
  @IsInt()
  @Min(1)
  quantity: number;

  // Giá tổng của combo (đã là giá cuối cho cả gói)
  @IsNumber()
  @Min(0)
  price: number;

  // Giá gốc (giá gạch) để hiển thị mức giảm, tùy chọn
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  // Freeship cho bậc này hay không
  @IsOptional()
  @IsBoolean()
  freeship?: boolean;

  // Nhãn hiển thị tùy chọn (bỏ trống -> FE tự dựng "N sản phẩm")
  @IsOptional()
  @IsString()
  label?: string;
}
