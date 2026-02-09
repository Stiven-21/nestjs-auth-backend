import { BaseOauthGuard } from 'src/modules/auth/guards/oauth/base-oauth.guard';
export const FacebookLoginGuard = BaseOauthGuard('facebook', 'login');
