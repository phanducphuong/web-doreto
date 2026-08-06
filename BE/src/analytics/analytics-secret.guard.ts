import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, timingSafeEqual } from 'crypto';
import type { Request } from 'express';
import {
  ANALYTICS_SECRET_ENV,
  ANALYTICS_SECRET_HEADER,
} from './analytics.constants';

/**
 * So sánh timing-safe: hash SHA-256 cả hai vế về buffer cùng độ dài
 * trước khi timingSafeEqual (hàm này throw nếu độ dài khác nhau).
 */
function secretMatches(provided: string, expected: string): boolean {
  const providedHash = createHash('sha256').update(provided).digest();
  const expectedHash = createHash('sha256').update(expected).digest();
  return timingSafeEqual(providedHash, expectedHash);
}

/**
 * Xác thực shared-secret cho endpoint analytics (decor → CRM gọi vào).
 * FAIL-CLOSED ở production — CHỦ ĐÍCH khác pattern opt-in phase 38 (advisory W1):
 * số liệu kinh doanh (doanh số camp) không được lộ khi quên set env.
 * - Env trống + NODE_ENV=production → THROW 401 (từ chối mọi request).
 * - Env trống + NODE_ENV khác production → cho qua (dev tiện chạy local) + warn 1 lần.
 * - Env có giá trị → bắt buộc header x-analytics-secret khớp (timing-safe), sai/thiếu → 401.
 * KHÔNG log giá trị secret ở bất kỳ nhánh nào.
 */
@Injectable()
export class AnalyticsSecretGuard implements CanActivate {
  private readonly logger = new Logger(AnalyticsSecretGuard.name);

  constructor() {
    // Guard được Nest khởi tạo 1 lần lúc map route → cảnh báo này chỉ log 1 lần lúc boot.
    if (!process.env[ANALYTICS_SECRET_ENV]?.trim()) {
      const inProd = process.env.NODE_ENV === 'production';
      this.logger.warn(
        inProd
          ? `API analytics chạy ở production KHÔNG có ${ANALYTICS_SECRET_ENV} — MỌI request sẽ bị TỪ CHỐI (fail-closed).`
          : `API analytics đang chạy KHÔNG có ${ANALYTICS_SECRET_ENV} — cho qua ở môi trường dev, nhớ set env khi deploy.`,
      );
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const expected = process.env[ANALYTICS_SECRET_ENV]?.trim();
    if (!expected) {
      // Fail-closed: production quên set secret → chặn để không lộ số liệu kinh doanh.
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException(
          'API analytics chưa cấu hình secret — từ chối truy cập.',
        );
      }
      return true; // dev: cho qua để chạy local
    }

    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers[ANALYTICS_SECRET_HEADER];
    const provided = typeof header === 'string' ? header : undefined;
    if (!provided || !secretMatches(provided, expected)) {
      throw new UnauthorizedException(
        'Sai hoặc thiếu secret analytics (header x-analytics-secret).',
      );
    }
    return true;
  }
}
