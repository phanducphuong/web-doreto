import { IsEnum, IsString, MinLength } from 'class-validator';
import { ContactSpamKind } from '../schemas/contact-spam-block.schema';

export class CreateContactSpamBlockDto {
  @IsEnum(ContactSpamKind)
  kind: ContactSpamKind;

  @IsString()
  @MinLength(1)
  value: string;
}
