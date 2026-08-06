// DTO ingest sự kiện funnel (endpoint public) — KHÔNG field meta tự do
// để chặn PII/payload rác lọt vào bảng tracking.
import { Type } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { UtmDto } from 'src/common/dto/utm.dto';
import { VISITOR_EVENT_TYPES } from 'src/tracking/tracking.constants';
import type { VisitorEventType } from 'src/tracking/tracking.constants';

export class TrackEventDto {
  @IsUUID('4')
  sessionId: string;

  @IsUUID('4')
  visitorId: string;

  // Whitelist 5 loại event funnel (D-05)
  @IsIn(VISITOR_EVENT_TYPES, { message: 'Loại sự kiện không hợp lệ' })
  type: VisitorEventType;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  camp?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UtmDto)
  utm?: UtmDto;

  @IsOptional()
  @IsUUID('4')
  productId?: string;

  @IsOptional()
  @IsUUID('4')
  orderId?: string;
}
