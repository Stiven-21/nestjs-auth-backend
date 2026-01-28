import { applyDecorators, UseGuards } from '@nestjs/common';
import { UserSelfOrAdminGuard } from 'src/modules/users/guard/user-self-or-admin.guard';

export function UserSelfOrAdmin() {
  return applyDecorators(UseGuards(UserSelfOrAdminGuard));
}
