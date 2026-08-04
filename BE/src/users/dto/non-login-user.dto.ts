import { IsString, IsEmail } from 'class-validator';

export class NonLoginUserDto {
  @IsEmail()
  email?: string;
}
