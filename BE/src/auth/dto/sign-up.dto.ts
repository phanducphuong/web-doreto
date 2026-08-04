import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class SignUpDto {
  @IsString()
  @MinLength(2)
  name: string;

  // Email không bắt buộc — khách đăng ký chỉ cần tên + SĐT + mật khẩu
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  phone: string;
}
