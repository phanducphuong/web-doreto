import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Validate,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { UtmDto } from 'src/common/dto/utm.dto';

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

  // Snapshot attribution first-touch từ FE (37-04 sẽ gửi). Lưu nguyên văn (D-03) —
  // khớp mã camp sang CRM là việc phase 38. Thiếu field vẫn tạo liên hệ như cũ (D-07).
  @IsOptional()
  @IsUUID('4')
  visitorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(trimEmptyToUndefined)
  camp?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UtmDto)
  utm?: UtmDto;
}
