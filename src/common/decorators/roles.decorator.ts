import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums';

export const ROLES_KEY = 'roles';

/**
 * Restrict route to one or more roles.
 * Must be combined with `RolesGuard`.
 *
 * @example
 *   @Roles(UserRole.ADMIN)
 *   @Get('/admin/users')
 */
export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
