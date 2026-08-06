import { Module } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  // AuthModule bắt buộc vì controller dùng JwtAuthGuard class-level
  imports: [AuthModule],
  controllers: [TrackingController],
  providers: [TrackingService],
  // Export dự phòng phase 38 cần inject TrackingService
  exports: [TrackingService],
})
export class TrackingModule {}
