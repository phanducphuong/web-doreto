import { IsString, MinLength } from 'class-validator';

export class SignInDto {
  @IsString()
  username: string; // Can be email or phone number

  @IsString()
  @MinLength(6)
  password: string;
}
