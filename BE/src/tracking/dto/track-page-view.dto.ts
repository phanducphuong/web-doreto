// DTO ingest page view (endpoint public) — whitelist global (main.ts) tự bỏ field lạ,
// đây là tuyến phòng thủ PII: chỉ nhận id UUID + url/path/camp/utm, không field tự do.
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { UtmDto } from 'src/common/dto/utm.dto';

export class TrackPageViewDto {
  // id phiên do client sinh (UUID v4)
  @IsUUID('4')
  sessionId: string;

  // visitor_id từ cookie ẩn danh first-party
  @IsUUID('4')
  visitorId: string;

  @IsString()
  @MaxLength(512)
  path: string;

  @IsString()
  @MaxLength(2048)
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  referrer?: string;

  // Mã camp first-touch — lưu nguyên văn, không map (D-03)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  camp?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UtmDto)
  utm?: UtmDto;
}
