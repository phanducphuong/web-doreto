import { IsNumber } from 'class-validator';

export class RemoveFeedbackProductDto {
  @IsNumber()
  id: number;
}
