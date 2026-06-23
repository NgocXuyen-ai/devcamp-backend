import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Types } from 'mongoose';
import { UserRole } from '../enums';

export interface AuthenticatedUser {
  userId: Types.ObjectId;
  username: string;
  role: UserRole;
  email?: string;
}

interface AuthenticatedRequest {
  user: AuthenticatedUser;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
