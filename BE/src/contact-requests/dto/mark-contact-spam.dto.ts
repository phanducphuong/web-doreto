import { IsBoolean } from 'class-validator';

export class MarkContactSpamDto {
  @IsBoolean()
  blockEmail: boolean;

  @IsBoolean()
  blockPhone: boolean;
}
