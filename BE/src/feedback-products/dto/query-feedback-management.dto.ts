import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryFeedbackManagementDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  score?: number;

  @IsOptional()
  @IsIn(['replied', 'unreplied'])
  replyStatus?: 'replied' | 'unreplied';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  hasImage?: number;

  @IsOptional()
  @IsString()
  reviewerKeyword?: string;
}
