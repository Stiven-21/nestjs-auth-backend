import { applyDecorators, UseGuards } from '@nestjs/common';
import { PermissionGuard } from 'src/modules/auth/guards/permission.guard';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Permissions } from './permissions.decorator';
import { SuperadminGuard } from '../guards/superadmin.guard';

export function Auth(permission?: string) {
  return applyDecorators(
    Permissions(permission),
    UseGuards(AuthGuard, PermissionGuard),
    ApiBearerAuth(),
  );
}

export function SuperadminOnlyAuth() {
  return applyDecorators(
    UseGuards(AuthGuard, SuperadminGuard),
    ApiBearerAuth(),
  );
}
