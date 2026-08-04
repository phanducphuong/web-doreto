import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackProductsController } from './feedback-products.controller';
import { FeedbackProductsService } from './feedback-products.service';

describe('FeedbackProductsController', () => {
  let controller: FeedbackProductsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedbackProductsController],
      providers: [FeedbackProductsService],
    }).compile();

    controller = module.get<FeedbackProductsController>(
      FeedbackProductsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
