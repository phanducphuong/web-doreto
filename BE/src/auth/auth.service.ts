import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from 'src/@types/auth.types';
import { Role } from 'src/common/enums/role.enum';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async getProfile(userId: string) {
    return this.usersService.findOne(userId);
  }

  /**
   * Detect if username is email or phone number
   */
  private detectUsernameType(username: string): 'email' | 'phone' {
    // Simple email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(username)) {
      return 'email';
    }
    return 'phone';
  }

  /**
   * Find user by username (email or phone number)
   */
  async findUserByUsername(username: string) {
    const usernameType = this.detectUsernameType(username);

    if (usernameType === 'email') {
      return this.usersService.findByEmail(username);
    } else {
      return this.usersService.findByPhoneNumber(username);
    }
  }

  async signUp(body: SignUpDto) {
    const { name, email, password, phone } = body;

    // Email không bắt buộc: nếu khách không nhập thì tự sinh email tạm từ SĐT
    // (schema đang yêu cầu email duy nhất; SĐT đã check trùng nên email tạm cũng duy nhất)
    const normalizedEmail =
      email?.trim().toLowerCase() ||
      `${phone.replace(/\D/g, '')}@khach-hang.local`;

    await this.usersService.checkDuplicateFields({
      email: normalizedEmail,
      phoneNumber: phone,
    });

    const userData: any = {
      email: normalizedEmail,
      phoneNumber: phone,
      password,
      name: name.trim(),
      role: Role.CUSTOMER,
    };

    const user = await this.usersService.create(userData);

    const token = await this.generateTokens({
      sub: String(user._id),
      email: user.email,
      role: user.role,
    });

    return {
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
      ...token,
    };
  }

  async signIn(signInDto: SignInDto) {
    const { username, password } = signInDto;

    const user = await this.findUserByUsername(username);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: String(user._id),
      email: user.email,
      role: user.role,
    };

    const token = await this.generateTokens(payload);
    return {
      user: {
        id: user._id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        name: user.name,
        role: user.role,
      },
      ...token,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = await this.jwtService.verifyAsync<
        JwtPayload & { iat: number; exp: number }
      >(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const payload = {
        sub: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };

      const user = await this.usersService.findOne(payload.sub);

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException();
      }

      const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);

      if (!isMatch) {
        throw new UnauthorizedException();
      }

      return this.generateTokens(payload);
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
    return { message: 'Logged out successfully' };
  }

  // Helper để tạo bộ đôi token, tránh lặp lại code và fix lỗi sign
  private async generateTokens(payload: JwtPayload) {
    const accessToken = await this.jwtService.signAsync(payload);

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES') || '7d',
    });

    // Hash refresh token để lưu vào DB
    const hashedRt = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(payload.sub, hashedRt);

    return {
      accessToken,
      refreshToken,
    };
  }
}
