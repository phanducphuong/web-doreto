import {
  ArrayMaxSize,
  IsArray,
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsUrl,
  MaxLength,
} from 'class-validator';

/** Admin tạo feedback gắn thẳng vào sản phẩm (không cần đơn hàng). */
export class AdminCreateFeedbackProductDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  score: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  comment?: string;

  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @IsUrl({}, { each: true })
  @IsOptional()
  images?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(100)
  displayName?: string;
}
