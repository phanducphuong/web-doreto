import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackProductsService } from './feedback-products.service';

describe('FeedbackProductsService', () => {
  let service: FeedbackProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeedbackProductsService],
    }).compile();

    service = module.get<FeedbackProductsService>(FeedbackProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
