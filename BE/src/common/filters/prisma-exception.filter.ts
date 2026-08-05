import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

/**
 * Ánh xạ lỗi Prisma phổ biến sang HTTP status đúng nghĩa, thay vì 500:
 * - P2023: id sai định dạng (vd không phải uuid — id Mongo cũ trong bookmark) → 404
 * - P2025: bản ghi không tồn tại → 404
 * - P2003: vi phạm khóa ngoại (dữ liệu đang được tham chiếu) → 409
 * - P2002: trùng unique → 409
 * Service nào cần thông báo cụ thể hơn thì tự catch trước khi lỗi rơi xuống đây.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    let status: number;
    let message: string;

    switch (exception.code) {
      case 'P2023':
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'Không tìm thấy dữ liệu';
        break;
      case 'P2003':
        status = HttpStatus.CONFLICT;
        message = 'Dữ liệu đang được tham chiếu bởi dữ liệu khác, không thể thao tác';
        break;
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message = 'Dữ liệu bị trùng';
        break;
      default:
        this.logger.error(
          `Lỗi Prisma chưa được ánh xạ: ${exception.code}`,
          exception.message,
        );
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Internal server error';
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: HttpStatus[status],
    });
  }
}
