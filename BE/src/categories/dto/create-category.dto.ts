import { IsOptional, IsString, IsUUID, IsInt } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsInt()
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
