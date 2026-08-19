import {
  IsBoolean,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OptionValueDto } from './option-value.dto';
import { ComboTierDto } from './combo-tier.dto';

export class CreateProductDto {
  @IsString()
  name: string;

  // Slug SEO cho URL. Bỏ trống -> BE tự sinh từ tên (tự thêm hậu tố nếu trùng).
  // Có nhập -> dùng đúng slug đó, trùng thì báo lỗi 409.
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Tiêu đề trang (og:title) hiện khi chia sẻ link SP lên FB/Zalo. Bỏ trống -> dùng tên SP.
  @IsOptional()
  @IsString()
  pageTitle?: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  tagIds?: string[];

  // Sản phẩm tương tự do admin chọn tay (hiển thị ở trang chi tiết)
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  similarProductIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productOptions?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionValueDto)
  optionValues?: OptionValueDto[];

  // Bậc combo theo tổng số lượng (tùy chọn) — lưu riêng theo từng SP
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComboTierDto)
  comboTiers?: ComboTierDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  thumbnailUrls?: string[];

  // Khung ảnh áp cho ảnh trong mô tả (null = bỏ khung)
  @IsOptional()
  @IsUUID()
  descriptionFrameId?: string | null;

  // Bật/tắt hiển thị trên shop (thiếu trường này thì whitelist strip im lặng)
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
