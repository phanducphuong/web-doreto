import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { AnalyticsSecretGuard } from './analytics-secret.guard';
import { ANALYTICS_SECRET_HEADER } from './analytics.constants';

const makeContext = (headers: Record<string, unknown> = {}): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  }) as unknown as ExecutionContext;

// Guard warn 1 lần lúc khởi tạo khi env trống — nuốt log để test sạch.
const buildGuard = (): AnalyticsSecretGuard => {
  const guard = new AnalyticsSecretGuard();
  jest
    .spyOn((guard as any).logger, 'warn')
    .mockImplementation(() => undefined);
  return guard;
};

describe('AnalyticsSecretGuard — fail-closed production (D-01, chống advisory W1 phase 38)', () => {
  const originalSecret = process.env.ANALYTICS_API_SECRET;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.ANALYTICS_API_SECRET;
    } else {
      process.env.ANALYTICS_API_SECRET = originalSecret;
    }
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
    jest.restoreAllMocks();
  });

  it('Case 1: NODE_ENV=production + env secret trống → THROW 401 (fail-closed)', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ANALYTICS_API_SECRET;
    const guard = buildGuard();

    expect(() => guard.canActivate(makeContext())).toThrow(
      UnauthorizedException,
    );
  });

  it('Case 2: NODE_ENV=test + env secret trống → cho qua (dev tiện chạy local)', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.ANALYTICS_API_SECRET;
    const guard = buildGuard();

    expect(guard.canActivate(makeContext())).toBe(true);
  });

  it('Case 3: env secret đặt + header x-analytics-secret khớp → cho qua', () => {
    process.env.NODE_ENV = 'production';
    process.env.ANALYTICS_API_SECRET = 'sieu-bi-mat-analytics-123';
    const guard = buildGuard();
    const ctx = makeContext({
      [ANALYTICS_SECRET_HEADER]: 'sieu-bi-mat-analytics-123',
    });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('Case 4: env secret đặt + header sai → THROW 401', () => {
    process.env.NODE_ENV = 'production';
    process.env.ANALYTICS_API_SECRET = 'sieu-bi-mat-analytics-123';
    const guard = buildGuard();
    const ctx = makeContext({ [ANALYTICS_SECRET_HEADER]: 'sai-secret' });

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('Case 5: env secret đặt + thiếu header → THROW 401', () => {
    process.env.NODE_ENV = 'production';
    process.env.ANALYTICS_API_SECRET = 'sieu-bi-mat-analytics-123';
    const guard = buildGuard();

    expect(() => guard.canActivate(makeContext())).toThrow(
      UnauthorizedException,
    );
  });

  it('Case phụ: header là mảng (gửi trùng) → 401, không crash timingSafeEqual', () => {
    process.env.NODE_ENV = 'production';
    process.env.ANALYTICS_API_SECRET = 'sieu-bi-mat-analytics-123';
    const guard = buildGuard();
    const ctx = makeContext({
      [ANALYTICS_SECRET_HEADER]: [
        'sieu-bi-mat-analytics-123',
        'sieu-bi-mat-analytics-123',
      ],
    });

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
