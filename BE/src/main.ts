import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    // Sau Cloud Run/LB: tin proxy để req.ip lấy IP khách thật (X-Forwarded-For),
    // cần cho rate limit theo IP hoạt động đúng.
    app.set('trust proxy', true);
    // Whitelist origin thay vì '*'. Domain production lấy từ env CORS_ORIGINS
    // (phân tách bằng dấu phẩy). Ở dev (NODE_ENV != production) cho phép MỌI origin
    // localhost/127.0.0.1 vì cổng FE dev thay đổi (autoPort 3000/3200/4000…).
    const isProd = process.env.NODE_ENV === 'production';
    const allowlist = (
      process.env.CORS_ORIGINS ?? 'https://dorreto.com,https://www.dorreto.com'
    )
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    const isLocalhost = (origin: string) =>
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    app.enableCors({
      origin: (origin, cb) => {
        // Request không có Origin (curl, server-to-server) → cho qua.
        if (!origin) return cb(null, true);
        if (allowlist.includes(origin)) return cb(null, true);
        if (!isProd && isLocalhost(origin)) return cb(null, true);
        // Origin không hợp lệ: KHÔNG throw (tránh 500). Trả về không kèm header CORS
        // → trình duyệt tự chặn cross-origin, request vẫn phản hồi bình thường.
        return cb(null, false);
      },
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: false,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    app.useGlobalFilters(new PrismaExceptionFilter());

    const port = process.env.PORT ?? 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`Application is running on port ${port} bound to 0.0.0.0`);
  } catch (err) {
    console.error('Failed to start application:', err);
    process.exit(1);
  }
}
void bootstrap();
