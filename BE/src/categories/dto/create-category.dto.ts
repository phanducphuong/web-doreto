import { IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  parentId?: number;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;
}
