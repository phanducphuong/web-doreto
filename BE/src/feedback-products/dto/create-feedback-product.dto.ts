import {
  ArrayMaxSize,
  IsArray,
  IsString,
  IsOptional,
  IsMongoId,
  IsInt,
  Min,
  Max,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateFeedbackProductDto {
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  comment?: string;

  @IsMongoId()
  purchaseOrderId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  score?: number;

  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @IsUrl({}, { each: true })
  @IsOptional()
  images?: string[];
}
