import {
  IsMongoId,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OptionValueDto } from './option-value.dto';
import { Types } from 'mongoose';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  categoryIds?: number[];

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  tagIds?: number[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productOptions?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionValueDto)
  optionValues?: OptionValueDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  thumbnailUrls?: string[];
}
