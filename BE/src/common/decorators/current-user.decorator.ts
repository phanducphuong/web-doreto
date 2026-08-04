import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from 'src/@types/auth.types';

export const CurrentUser = createParamDecorator(
  <K extends keyof AuthUser>(
    data: K,
    ctx: ExecutionContext,
  ): AuthUser[K] | AuthUser | null => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as AuthUser;

    if (!user) return null;

    return data ? user[data] : user;
  },
);
