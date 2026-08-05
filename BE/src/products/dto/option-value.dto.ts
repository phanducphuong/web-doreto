import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  Min,
  IsUUID,
} from 'class-validator';

export class OptionValueDto {
  @IsUUID()
  @IsOptional()
  _id?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  purchaseCount?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productOptionNames?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;
}
