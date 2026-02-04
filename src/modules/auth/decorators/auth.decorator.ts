import { applyDecorators, UseGuards } from '@nestjs/common';
import { PermissionGuard } from 'src/modules/auth/guards/permission.guard';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Permissions } from 'src/modules/auth/decorators/permissions.decorator';
import { SuperadminGuard } from 'src/modules/auth/guards/superadmin.guard';
import { AuthOptions } from 'src/common/interfaces/auth-option.interface';
import { UserSelfOrAdminGuard } from 'src/modules/auth/guards/user-self-or-admin.guard';
import { CanActivate, Type } from '@nestjs/common';

export function Auth(permission?: string, options?: AuthOptions) {
  const guards: Type<CanActivate>[] = [AuthGuard];

  if (permission) guards.push(PermissionGuard);
  if (options?.allowSelf) guards.push(UserSelfOrAdminGuard);
  if (options?.superadminOnly) guards.push(SuperadminGuard);

  return applyDecorators(
    permission ? Permissions(permission) : Permissions(),
    UseGuards(...guards),
    ApiBearerAuth(),
  );
}
