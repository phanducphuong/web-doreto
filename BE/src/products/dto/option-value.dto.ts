import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  Min,
  IsMongoId,
} from 'class-validator';

export class OptionValueDto {
  @IsMongoId()
  @IsOptional()
  _id?: string;

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
