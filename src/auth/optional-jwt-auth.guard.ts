import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT guard "optional": nếu không có token hoặc token không hợp lệ thì trả về null,
 * thay vì throw 401. Dùng cho các route có thể chạy ở chế độ demo.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(err: unknown, user: TUser): TUser | null {
    if (err) return null;
    return user ?? null;
  }
}
