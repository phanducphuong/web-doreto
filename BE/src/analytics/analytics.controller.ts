import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsSecretGuard } from './analytics-secret.guard';
import { ANALYTICS_REPORT_MAX_RANGE_DAYS } from './analytics.constants';

const DATE_STRING_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Decor KHÔNG có APP_GUARD toàn cục → chỉ cần AnalyticsSecretGuard (lớp auth DUY NHẤT).
// KHÔNG JwtAuthGuard, KHÔNG @Public (không có guard toàn cục để bypass).
@UseGuards(AnalyticsSecretGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // Route TRẦN (decor không có prefix /api) — hợp đồng tổng quát D-02.
  @Get('summary')
  getSummary(
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
    if (rangeDays > ANALYTICS_REPORT_MAX_RANGE_DAYS) {
      throw new BadRequestException('Khoảng ngày tối đa 62 ngày');
    }

    return this.analyticsService.buildSummary(fromDate, toDate);
  }
}
