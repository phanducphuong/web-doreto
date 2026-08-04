import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { AuthUser } from 'src/@types/auth.types';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  handleRequest<TUser = any>(
    err: unknown,
    user: TUser,
    info: unknown,
    context: ExecutionContext,
  ): TUser {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    const roles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // 🌐 Public → optional auth
    if (isPublic) {
      return (user ?? null) as TUser;
    }

    // ❌ lỗi từ passport (token sai, hết hạn...)
    if (err || info) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }

    // ❌ chưa login (không có token)
    if (!user) {
      throw new UnauthorizedException('Chưa đăng nhập');
    }

    // 🔐 không yêu cầu role
    if (!roles || roles.length === 0) {
      return user;
    }

    const authUser = user as unknown as AuthUser;

    const hasRole = roles.some((role) => role === authUser.role);

    if (!hasRole) {
      throw new ForbiddenException('Không đủ quyền');
    }

    return user;
  }
}
