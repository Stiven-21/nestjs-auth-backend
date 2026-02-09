import { BaseOauthGuard } from 'src/modules/auth/guards/oauth/base-oauth.guard';

export const GoogleLoginGuard = BaseOauthGuard('google', 'login');
