// DTO utm_* dùng chung cho tracking (ingest event) và đơn hàng/liên hệ (attribution).
// Tên field giữ nguyên snake_case khớp query param thật trên URL — lưu nguyên văn,
// việc khớp sang CRM là chuyện phase 38. MaxLength chặn payload phình (endpoint public).
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UtmDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  utm_source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  utm_medium?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  utm_campaign?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  utm_term?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  utm_content?: string;
}
