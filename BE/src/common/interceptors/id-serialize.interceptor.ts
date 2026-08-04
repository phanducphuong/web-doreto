import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Giữ hợp đồng API với frontend: FE đọc trường `_id` (kiểu Mongo cũ),
 * còn Postgres/Prisma dùng `id`. Interceptor này duyệt đệ quy mọi response,
 * với mỗi object có `id` thì thêm `_id` cùng giá trị (giữ nguyên `id`).
 */
function addUnderscoreId(value: unknown, seen = new WeakSet()): unknown {
  if (value === null || typeof value !== 'object') return value;

  // Không đụng vào Date, Buffer...
  if (value instanceof Date || Buffer.isBuffer(value)) return value;

  if (Array.isArray(value)) {
    return value.map((item) => addUnderscoreId(item, seen));
  }

  if (seen.has(value as object)) return value;
  seen.add(value as object);

  const obj = value as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    obj[key] = addUnderscoreId(obj[key], seen);
  }

  if ('id' in obj && obj['id'] !== undefined && obj['_id'] === undefined) {
    obj['_id'] = obj['id'];
  }

  return obj;
}

@Injectable()
export class IdSerializeInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => addUnderscoreId(data)));
  }
}
