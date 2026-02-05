import { SetMetadata } from '@nestjs/common';

export const REAUTH_REQUIRED_KEY = 'reauth_required';

export const RequireReAuth = () => SetMetadata(REAUTH_REQUIRED_KEY, true);
