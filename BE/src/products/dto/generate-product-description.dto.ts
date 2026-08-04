import { IsArray, IsOptional, IsString } from 'class-validator';

export class GenerateProductDescriptionDto {
  @IsString()
  rawText: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryNames?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagNames?: string[];
}
