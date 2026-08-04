import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ReportingService } from './reporting.service';

@UseGuards(JwtAuthGuard)
@Controller('reporting')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('orders/overview')
  getOverview(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const { parsedFromDate, parsedToDate } = this.parseDateRange(
      fromDate,
      toDate,
    );
    return this.reportingService.getOverview(parsedFromDate, parsedToDate);
  }

  @Get('orders/timeseries')
  getOrderTimeSeries(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const { parsedFromDate, parsedToDate } = this.parseDateRange(
      fromDate,
      toDate,
    );
    return this.reportingService.getOrderTimeSeries(
      parsedFromDate,
      parsedToDate,
    );
  }

  @Get('orders/funnel')
  getOrderFunnel(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const { parsedFromDate, parsedToDate } = this.parseDateRange(
      fromDate,
      toDate,
    );
    return this.reportingService.getOrderFunnel(parsedFromDate, parsedToDate);
  }

  @Get('products/top')
  getTopProducts(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    const { parsedFromDate, parsedToDate } = this.parseDateRange(
      fromDate,
      toDate,
    );
    return this.reportingService.getTopProducts(
      parsedFromDate,
      parsedToDate,
      limit ?? 10,
    );
  }

  @Get('customers/top')
  getTopCustomers(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    const { parsedFromDate, parsedToDate } = this.parseDateRange(
      fromDate,
      toDate,
    );
    return this.reportingService.getTopCustomers(
      parsedFromDate,
      parsedToDate,
      limit ?? 10,
    );
  }

  private parseDateRange(fromDate?: string, toDate?: string) {
    const parsedFromDate = this.parseDate(fromDate, 'fromDate');
    const parsedToDate = this.parseDate(toDate, 'toDate');

    if (parsedFromDate && parsedToDate && parsedFromDate > parsedToDate) {
      throw new BadRequestException(
        'fromDate must be before or equal to toDate',
      );
    }

    return { parsedFromDate, parsedToDate };
  }

  private parseDate(value?: string, field?: string): Date | undefined {
    if (!value) {
      return undefined;
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException(`${field} must be a valid date`);
    }
    return parsedDate;
  }
}
