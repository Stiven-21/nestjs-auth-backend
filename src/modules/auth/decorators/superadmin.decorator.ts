import { SetMetadata } from '@nestjs/common';

export const SUPERADMIN_KEY = 'isSuperadmin';
export const SuperadminOnly = () => SetMetadata(SUPERADMIN_KEY, true);
