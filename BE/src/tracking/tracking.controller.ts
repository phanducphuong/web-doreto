import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { TrackingService } from './tracking.service';
import { TrackPageViewDto } from './dto/track-page-view.dto';
import { TrackEventDto } from './dto/track-event.dto';
import { TRACKING_REPORT_MAX_RANGE_DAYS } from './tracking.constants';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

const DATE_STRING_REGEX = /^\d{4}-\d{2}-\d{2}$/;

@UseGuards(JwtAuthGuard)
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  // Ingest từ trình duyệt khách — public, fail-silent trong service (D-07).
  // page_views/visitor_events là bảng append-only → siết 120 lần/phút/IP chống
  // bơm phồng DB (duyệt web bình thường không chạm ngưỡng này).
  @Public()
  @Post('page-view')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  trackPageView(
    @Body() body: TrackPageViewDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.trackingService.ingestPageView(body, userAgent);
  }

  @Public()
  @Post('event')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  trackEvent(
    @Body() body: TrackEventDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.trackingService.ingestEvent(body, userAgent);
  }

  // Rebuild on-demand + trả rows — chỉ admin (D-08, repo không có cron)
  @Roles(Role.ADMIN)
  @Get('reports/daily')
  getDailyReports(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    if (
      !fromDate ||
      !toDate ||
      !DATE_STRING_REGEX.test(fromDate) ||
      !DATE_STRING_REGEX.test(toDate)
    ) {
      throw new BadRequestException(
        'fromDate/toDate phải theo định dạng YYYY-MM-DD',
      );
    }
    if (fromDate > toDate) {
      throw new BadRequestException('fromDate phải nhỏ hơn hoặc bằng toDate');
    }
    const rangeDays =
      (new Date(`${toDate}T00:00:00.000Z`).getTime() -
        new Date(`${fromDate}T00:00:00.000Z`).getTime()) /
        (24 * 60 * 60 * 1000) +
      1;
    if (rangeDays > TRACKING_REPORT_MAX_RANGE_DAYS) {
      throw new BadRequestException('Khoảng ngày tối đa 62 ngày');
    }

    return this.trackingService.rebuildAndListDailyReports(fromDate, toDate);
  }
}
