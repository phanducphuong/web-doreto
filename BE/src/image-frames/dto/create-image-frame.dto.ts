import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateImageFrameDto {
  @IsString()
  name: string;

  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  insetTop?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  insetRight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  insetBottom?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  insetLeft?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
