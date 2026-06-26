import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Types } from 'mongoose';
import { Request } from 'express';

export interface CurrentUserPayload {
  userId: string;
  username: string;
  avatar?: string;
}

interface RawAuthUser {
  userId: string | Types.ObjectId;
  username: string;
  avatar?: string;
}
interface AuthenticatedRequest extends Request {
  user: RawAuthUser;
}
/**
 * Đọc request.user (đã được JwtAuthGuard + Passport gán sẵn) và
 * CHUẨN HÓA userId về string.
 *
 * JwtStrategy.validate() trả userId dạng Types.ObjectId, nhưng toàn bộ
 * BattlesService/CodeAnalysisService đang giả định userId là string
 * (so sánh .toString() === userId, lưu vào Map, v.v.). Convert ngay tại
 * đây để không phải sửa lại business logic bên trong.
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    return {
      ...user,
      userId:
        user.userId instanceof Types.ObjectId
          ? user.userId.toString()
          : user.userId,
    };
  },
);
