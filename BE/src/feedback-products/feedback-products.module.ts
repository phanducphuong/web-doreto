import { Module } from '@nestjs/common';
import { FeedbackProductsService } from './feedback-products.service';
import { FeedbackProductsController } from './feedback-products.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FeedbackProductsController],
  providers: [FeedbackProductsService],
  exports: [FeedbackProductsService],
})
export class FeedbackProductsModule {}
