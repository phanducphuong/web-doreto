import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FeedbackProductsService } from './feedback-products.service';
import { CreateFeedbackProductDto } from './dto/create-feedback-product.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { ReplyFeedbackProductDto } from './dto/reply-feedback-product.dto';
import { QueryFeedbackManagementDto } from './dto/query-feedback-management.dto';
import { AdminCreateFeedbackProductDto } from './dto/admin-create-feedback-product.dto';
import { AdminUpdateFeedbackProductDto } from './dto/admin-update-feedback-product.dto';

@UseGuards(JwtAuthGuard)
@Controller('feedback-products')
export class FeedbackProductsController {
  constructor(
    private readonly feedbackProductsService: FeedbackProductsService,
  ) {}

  @Post()
  create(
    @CurrentUser('userId') userId: string,
    @Body() createFeedbackProductDto: CreateFeedbackProductDto,
  ) {
    return this.feedbackProductsService.createOrUpdateFeedback(
      userId,
      createFeedbackProductDto,
    );
  }

  @Public()
  @Get()
  findAll() {
    return this.feedbackProductsService.findAll();
  }

  @Roles(Role.ADMIN)
  @Get('management')
  findForManagement(@Query() query: QueryFeedbackManagementDto) {
    return this.feedbackProductsService.findForManagement(query);
  }

  @Roles(Role.ADMIN)
  @Post('admin')
  adminCreate(@Body() dto: AdminCreateFeedbackProductDto) {
    return this.feedbackProductsService.adminCreateFeedback(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  adminUpdate(
    @Param('id') id: string,
    @Body() dto: AdminUpdateFeedbackProductDto,
  ) {
    return this.feedbackProductsService.adminUpdateFeedback(id, dto);
  }

  @Public()
  @Get('product/:productId')
  findByProductId(@Param('productId') productId: string) {
    return this.feedbackProductsService.findByProductId(productId);
  }

  @Public()
  @Get('product/:productId/average')
  getAverage(@Param('productId') productId: string) {
    return this.feedbackProductsService.getAverageByProductId(productId);
  }

  @Get('my/:productId')
  findMyFeedback(
    @CurrentUser('userId') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.feedbackProductsService.findByUserAndProduct(userId, productId);
  }

  @Roles(Role.ADMIN)
  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.feedbackProductsService.findByUserId(userId);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/reply')
  reply(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: ReplyFeedbackProductDto,
  ) {
    return this.feedbackProductsService.reply(id, userId, dto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.feedbackProductsService.removeFeedback(id, userId, role);
  }
}
