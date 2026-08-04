import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'hasPhoneOrEmail', async: false })
class HasPhoneOrEmailConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments) {
    const obj = args.object as CreateContactRequestDto;
    const phone = obj.phone?.trim() ?? '';
    const email = obj.email?.trim() ?? '';
    return phone.length > 0 || email.length > 0;
  }

  defaultMessage() {
    return 'Cần có ít nhất email hoặc số điện thoại';
  }
}

function trimEmptyToUndefined({
  value,
}: {
  value: unknown;
}): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') {
    const t = value.trim();
    return t === '' ? undefined : t;
  }
  return undefined;
}

function trimRequiredString({ value }: { value: unknown }): string {
  return typeof value === 'string' ? value.trim() : '';
}

export class CreateContactRequestDto {
  @Validate(HasPhoneOrEmailConstraint)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(trimRequiredString)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Transform(trimEmptyToUndefined)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  @Transform(trimEmptyToUndefined)
  email?: string;
}
