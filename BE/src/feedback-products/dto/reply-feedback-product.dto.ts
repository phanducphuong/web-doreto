import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class ReplyFeedbackProductDto {
  @IsString()
  @MaxLength(1000)
  content: string;

  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @IsUrl({}, { each: true })
  @IsOptional()
  images?: string[];
}
