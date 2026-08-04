import { IsBoolean } from 'class-validator';

export class UpdateContactRequestDoneDto {
  @IsBoolean()
  done: boolean;
}
