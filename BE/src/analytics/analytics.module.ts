import { Module } from '@nestjs/common';
import { TrackingModule } from '../tracking/tracking.module';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsSecretGuard } from './analytics-secret.guard';

// PrismaModule là @Global (không import lại — tiền lệ 38-03).
// AuthModule KHÔNG cần — endpoint dùng AnalyticsSecretGuard, không JWT.
@Module({
  imports: [TrackingModule], // tái dùng TrackingService.rebuildAndListDailyReports
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsSecretGuard],
})
export class AnalyticsModule {}
