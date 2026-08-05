import {
  ArrayMaxSize,
  IsArray,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsUrl,
  MaxLength,
} from 'class-validator';

/** Admin sửa nội dung một feedback (điểm, bình luận, ảnh, tên hiển thị). */
export class AdminUpdateFeedbackProductDto {
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  score?: number;

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
