import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateTagDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
