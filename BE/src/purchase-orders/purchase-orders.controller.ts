import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { Role } from 'src/common/enums/role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { PurchaseOrderStatus } from 'src/common/enums/purchase-order.enum';

@UseGuards(JwtAuthGuard)
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @Public()
  create(
    @Body() createPurchaseOrderDto: CreatePurchaseOrderDto,
    @CurrentUser('role') role: Role,
  ) {
    return this.purchaseOrdersService.createPurchaseOrder(
      createPurchaseOrderDto,
      role,
    );
  }

  @Get()
  findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('userId') userId?: string,
    @Query('state') status?: PurchaseOrderStatus,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const parsedFromDate = this.parseDate(fromDate, 'fromDate');
    const parsedToDate = this.parseDate(toDate, 'toDate');

    if (parsedFromDate && parsedToDate && parsedFromDate > parsedToDate) {
      throw new BadRequestException(
        'fromDate must be before or equal to toDate',
      );
    }

    return this.purchaseOrdersService.findAllPaginated(
      page,
      limit,
      userId,
      status,
      parsedFromDate,
      parsedToDate,
    );
  }

  @Get('user')
  findAllByUserId(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @CurrentUser('userId') userId: string,
  ) {
    return this.purchaseOrdersService.findAllByUserId(userId, page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchaseOrdersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDto,
  ) {
    return this.purchaseOrdersService.updatePurchaseOrder(
      id,
      updatePurchaseOrderDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.purchaseOrdersService.remove(id);
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
