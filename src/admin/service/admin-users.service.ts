import { BadRequestException, Injectable } from '@nestjs/common';
import { QueryFilter, Types } from 'mongoose';
import { paginate } from '../../common/dto/pagination.dto';
import { UserRole } from '../../common/enums';
import { UserDocument } from '../../users/schemas/users.schema';
import { UsersService } from '../../users/service/users.service';
import {
  AdminUpdateUserDto,
  AdminUserListQueryDto,
} from '../dto/admin-user.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly users: UsersService) {}

  // ----- list with admin-level filters -----

  async list(q: AdminUserListQueryDto) {
    const filter: QueryFilter<UserDocument> = {};

    if (q.search) {
      const safe = q.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { username: { $regex: safe, $options: 'i' } },
        { email: { $regex: safe, $options: 'i' } },
      ];
    }
    if (q.role) filter.role = q.role;
    if (q.field) filter.fieldFocus = q.field;
    if (q.isLocked !== undefined) filter.isLocked = q.isLocked;

    const limit = q.limit ?? 20;
    const page = q.page ?? 1;
    const skip = (page - 1) * limit;

    const { items, total } = await this.users.search(filter, skip, limit);
    return paginate(items, total, page, limit);
  }

  async getById(id: Types.ObjectId) {
    return this.users.findById(id);
  }

  // ----- update / lock / unlock / role -----

  async update(
    id: Types.ObjectId,
    dto: AdminUpdateUserDto,
    actorId: Types.ObjectId,
  ): Promise<UserDocument> {
    // Don't let an admin lock or demote themselves.
    if (id.equals(actorId)) {
      throw new BadRequestException(
        'Admin cannot modify their own role or lock state',
      );
    }
    let user = await this.users.findById(id);
    if (dto.role !== undefined) {
      user = await this.users.setRole(id, dto.role);
    }
    if (dto.isLocked !== undefined) {
      if (dto.isLocked) {
        const farFuture = new Date(Date.now() + 100 * 365 * 86_400_000);
        await this.users.lockAccount(id, farFuture);
      } else {
        await this.users.unlockAccount(id);
      }
      user = await this.users.findById(id);
    }
    return user;
  }

  /** Soft delete — flips isLocked + sets lockedUntil far future. */
  async softDelete(
    id: Types.ObjectId,
    actorId: Types.ObjectId,
  ): Promise<{ deleted: true }> {
    if (id.equals(actorId)) {
      throw new BadRequestException('Admin cannot delete their own account');
    }
    const target = await this.users.findById(id);
    if (target.role === UserRole.ADMIN) {
      throw new BadRequestException(
        'Cannot delete another admin via this endpoint',
      );
    }
    await this.users.softDelete(id);
    return { deleted: true };
  }
}
