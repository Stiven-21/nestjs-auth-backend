import { BaseOauthGuard } from 'src/modules/auth/guards/oauth/base-oauth.guard';

export const FacebookLinkGuard = BaseOauthGuard('facebook', 'link');
